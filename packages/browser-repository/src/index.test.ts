import { describe, expect, it } from "vitest";
import type { MissionDefinition, MissionId } from "@mission-studio/core";
import { BrowserMissionRepository } from "./index.js";

class FakeStorage {
  private value: string | null = null;
  getItem() { return this.value; }
  setItem(_key: string, value: string) { this.value = value; }
}

const mission: MissionDefinition = {
  id: "persisted" as MissionId, title: "Persisted mission", description: "", status: "draft",
  checkpoints: [], tags: [], metadata: {}, createdAt: "2026-07-22T00:00:00.000Z", updatedAt: "2026-07-22T00:00:00.000Z",
  rules: { completion: { mode: "all", requiredCount: 0, enforceOrder: false }, reward: { enabled: false, title: "", description: "" } },
};

describe("BrowserMissionRepository", () => {
  it("persists missions across repository instances", async () => {
    const storage = new FakeStorage();
    await new BrowserMissionRepository(storage).save(mission);
    expect(await new BrowserMissionRepository(storage).findById(mission.id)).toEqual(mission);
  });

  it("rejects unsupported storage schemas", async () => {
    const storage = new FakeStorage();
    storage.setItem("key", JSON.stringify({ schemaVersion: 99, missions: [] }));
    await expect(new BrowserMissionRepository(storage).list()).rejects.toThrow("Unsupported or damaged");
  });

  it("migrates version 1 missions with default rules", async () => {
    const storage = new FakeStorage();
    const { rules: _rules, ...legacyMission } = mission;
    storage.setItem("key", JSON.stringify({ schemaVersion: 1, missions: [legacyMission] }));
    const loaded = await new BrowserMissionRepository(storage).findById(mission.id);
    expect(loaded?.rules.completion.mode).toBe("all");
  });
});
