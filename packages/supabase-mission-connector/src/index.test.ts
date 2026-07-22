import { describe, expect, it } from "vitest";
import type { MissionDefinition, MissionId } from "@mission-studio/core";
import { SupabaseMissionConnector } from "./index.js";

const mission: MissionDefinition = {
  id: "mission" as MissionId, title: "Server", description: "", status: "draft", checkpoints: [], tags: [], metadata: {},
  createdAt: "2026-07-22T00:00:00.000Z", updatedAt: "2026-07-22T00:00:00.000Z",
  rules: { completion: { mode: "all", requiredCount: 0, enforceOrder: false }, reward: { enabled: false, title: "", description: "" } },
};

describe("SupabaseMissionConnector", () => {
  it("maps a mission to a vendor row only inside the connector", async () => {
    let row: Record<string, unknown> | undefined;
    const client = { from: () => ({ upsert: async (value: Record<string, unknown>) => { row = value; return { error: null }; } }) };
    await new SupabaseMissionConnector(client as never).upsert(mission);
    expect(row?.id).toBe("mission"); expect(row?.document).toEqual(mission);
  });
  it("returns a simple server error", async () => {
    const client = { from: () => ({ upsert: async () => ({ error: { message: "denied" } }) }) };
    await expect(new SupabaseMissionConnector(client as never).upsert(mission)).rejects.toThrow("서버 저장 실패: denied");
  });
  it("maps active and deleted rows to vendor-neutral snapshots", async () => {
    const rows = [{ id: "mission", document: mission, updated_at: mission.updatedAt, deleted_at: null }, { id: "deleted", document: null, updated_at: mission.updatedAt, deleted_at: mission.updatedAt }];
    const client = { from: () => ({ select: async () => ({ data: rows, error: null }) }) };
    const snapshots = await new SupabaseMissionConnector(client as never).listSnapshots();
    expect(snapshots.map((item) => item.state)).toEqual(["active", "deleted"]);
  });
});
