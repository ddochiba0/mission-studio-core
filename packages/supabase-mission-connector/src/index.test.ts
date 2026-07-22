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
    const client = { from: () => ({ upsert: async (value: Record<string, unknown>) => { row = value; return { error: null }; }, delete: () => ({ eq: async () => ({ error: null }) }) }) };
    await new SupabaseMissionConnector(client).upsert(mission);
    expect(row?.id).toBe("mission"); expect(row?.document).toEqual(mission);
  });
  it("returns a simple server error", async () => {
    const client = { from: () => ({ upsert: async () => ({ error: { message: "denied" } }), delete: () => ({ eq: async () => ({ error: null }) }) }) };
    await expect(new SupabaseMissionConnector(client).upsert(mission)).rejects.toThrow("서버 저장 실패: denied");
  });
});
