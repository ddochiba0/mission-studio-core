import { describe, expect, it } from "vitest";
import type { MissionDefinition, MissionId } from "@mission-studio/core";
import { SyncEngine, type MissionRemoteConnector, type SyncOperation, type SyncQueue } from "./index.js";

class Queue implements SyncQueue {
  operations: SyncOperation[] = [];
  async list() { return [...this.operations]; }
  async put(operation: SyncOperation) { this.operations = [...this.operations.filter((item) => item.id !== operation.id), operation]; }
  async remove(id: string) { this.operations = this.operations.filter((item) => item.id !== id); }
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
