import { describe, expect, it } from "vitest";
import type { MissionDefinition, MissionId } from "@mission-studio/core";
import { BidirectionalSyncEngine, MissionPullEngine, SyncConflictResolver, SyncEngine, type MissionRemoteConnector, type SyncOperation, type SyncQueue } from "./index.js";
import type { MissionRepository } from "@mission-studio/core";

class Queue implements SyncQueue {
  operations: SyncOperation[] = [];
  async list() { return [...this.operations]; }
  async put(operation: SyncOperation) { this.operations = [...this.operations.filter((item) => item.id !== operation.id), operation]; }
  async remove(id: string) { this.operations = this.operations.filter((item) => item.id !== id); }
}
class LocalRepository implements MissionRepository {
  missions: MissionDefinition[] = [];
  async list() { return [...this.missions]; }
  async findById(id: MissionId) { return this.missions.find((item) => item.id === id) ?? null; }
  async save(value: MissionDefinition) { this.missions = [...this.missions.filter((item) => item.id !== value.id), structuredClone(value)]; }
  async delete(id: MissionId) { const before = this.missions.length; this.missions = this.missions.filter((item) => item.id !== id); return before !== this.missions.length; }
}
const mission: MissionDefinition = {
  id: "mission" as MissionId, title: "Sync", description: "", status: "draft", checkpoints: [], tags: [], metadata: {},
  createdAt: "2026-07-22T00:00:00.000Z", updatedAt: "2026-07-22T00:00:00.000Z",
  rules: { completion: { mode: "all", requiredCount: 0, enforceOrder: false }, reward: { enabled: false, title: "", description: "" } },
};

describe("SyncEngine", () => {
  it("removes successfully delivered operations", async () => {
    const queue = new Queue(); await queue.put({ id: "1", type: "upsert", mission, queuedAt: mission.updatedAt, attempts: 0 });
    const remote: MissionRemoteConnector = { async upsert() {}, async delete() {} };
    expect(await new SyncEngine(queue, remote).flush()).toEqual({ state: "synced", completed: 1, pending: 0, errors: [] });
  });
  it("keeps failed operations for reconnection retry", async () => {
    const queue = new Queue(); await queue.put({ id: "1", type: "upsert", mission, queuedAt: mission.updatedAt, attempts: 0 });
    const remote: MissionRemoteConnector = { async upsert() { throw new Error("네트워크 연결을 확인하세요."); }, async delete() {} };
    const report = await new SyncEngine(queue, remote).flush();
    expect(report.state).toBe("error"); expect(report.pending).toBe(1); expect((await queue.list())[0]?.attempts).toBe(1);
  });
});

describe("MissionPullEngine", () => {
  it("downloads a newer server mission into the raw local repository", async () => {
    const local = new LocalRepository(); const queue = new Queue();
    const newer = { ...mission, title: "Server newer", updatedAt: "2026-07-22T01:00:00.000Z" };
    const report = await new MissionPullEngine(local, queue, { async listSnapshots() { return [{ id: mission.id, state: "active", mission: newer, updatedAt: newer.updatedAt }]; } }).pull();
    expect((await local.findById(mission.id))?.title).toBe("Server newer"); expect(report.downloaded).toBe(1);
  });
  it("does not overwrite a pending local edit", async () => {
    const local = new LocalRepository(); const queue = new Queue(); await local.save(mission);
    await queue.put({ id: "pending", type: "upsert", mission, queuedAt: mission.updatedAt, attempts: 0 });
    const newer = { ...mission, title: "Server newer", updatedAt: "2026-07-22T01:00:00.000Z" };
    const report = await new MissionPullEngine(local, queue, { async listSnapshots() { return [{ id: mission.id, state: "active", mission: newer, updatedAt: newer.updatedAt }]; } }).pull();
    expect((await local.findById(mission.id))?.title).toBe("Sync"); expect(report.conflicts).toHaveLength(1);
  });
  it("applies a server tombstone without creating a new upload", async () => {
    const local = new LocalRepository(); await local.save(mission);
    const report = await new MissionPullEngine(local, new Queue(), { async listSnapshots() { return [{ id: mission.id, state: "deleted", updatedAt: "2026-07-22T02:00:00.000Z" }]; } }).pull();
    expect(await local.findById(mission.id)).toBeNull(); expect(report.deleted).toBe(1);
  });
});

describe("conflict resolution", () => {
  it("marks an explicit local choice so the next synchronization can upload it", async () => {
    const local = new LocalRepository(); const queue = new Queue(); await local.save(mission);
    await queue.put({ id: "pending", type: "upsert", mission, queuedAt: mission.updatedAt, attempts: 0 });
    const newer = { ...mission, title: "Server", updatedAt: "2026-07-22T01:00:00.000Z" };
    const pull = new MissionPullEngine(local, queue, { async listSnapshots() { return [{ id: mission.id, state: "active", mission: newer, updatedAt: newer.updatedAt }]; } });
    const conflict = (await pull.pull()).conflicts[0]!;
    await new SyncConflictResolver(local, queue).resolve(conflict, "keep_local");
    expect((await pull.pull()).conflicts).toHaveLength(0); expect((await queue.list())[0]?.force).toBe(true);
  });
  it("replaces local work and clears its queued upload when the server choice is selected", async () => {
    const local = new LocalRepository(); const queue = new Queue(); await local.save(mission);
    await queue.put({ id: "pending", type: "upsert", mission, queuedAt: mission.updatedAt, attempts: 0 });
    const newer = { ...mission, title: "Server", updatedAt: "2026-07-22T01:00:00.000Z" };
    const conflict = { missionId: mission.id, local: mission, remote: { id: mission.id, state: "active" as const, mission: newer, updatedAt: newer.updatedAt } };
    await new SyncConflictResolver(local, queue).resolve(conflict, "use_remote");
    expect((await local.findById(mission.id))?.title).toBe("Server"); expect(await queue.list()).toHaveLength(0);
  });
  it("pulls before upload and blocks automatic overwrite when a conflict exists", async () => {
    const local = new LocalRepository(); const queue = new Queue(); await local.save(mission);
    await queue.put({ id: "pending", type: "upsert", mission, queuedAt: mission.updatedAt, attempts: 0 });
    const newer = { ...mission, title: "Server", updatedAt: "2026-07-22T01:00:00.000Z" }; let uploads = 0;
    const pull = new MissionPullEngine(local, queue, { async listSnapshots() { return [{ id: mission.id, state: "active", mission: newer, updatedAt: newer.updatedAt }]; } });
    const sync = new SyncEngine(queue, { async upsert() { uploads += 1; }, async delete() {} });
    const report = await new BidirectionalSyncEngine(pull, sync).synchronize();
    expect(report.upload).toBeNull(); expect(report.pull.conflicts).toHaveLength(1); expect(uploads).toBe(0);
  });
});
