import { describe, expect, it } from "vitest";
import type { MissionDefinition, MissionId } from "@mission-studio/core";
import { TemplateEngine } from "./index.js";

let id = 0;
const engine = new TemplateEngine({ createId: () => `new-${++id}`, now: () => new Date("2026-07-22T00:00:00.000Z") });
const mission: MissionDefinition = {
  id: "old" as MissionId, title: "Original", description: "", status: "published", tags: [], metadata: {},
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  checkpoints: [{ id: "old-point", title: "Point", sequence: 1, position: { latitude: 35, longitude: 127 } }],
  rules: { completion: { mode: "all", requiredCount: 0, enforceOrder: false }, reward: { enabled: false, title: "", description: "" } },
};

describe("TemplateEngine", () => {
  it("duplicates with new mission and checkpoint IDs as a draft", () => {
    const copy = engine.duplicate(mission);
    expect(copy.id).not.toBe(mission.id); expect(copy.checkpoints[0]?.id).not.toBe("old-point"); expect(copy.status).toBe("draft");
  });
  it("round-trips a valid exchange document", () => {
    const imported = engine.import(engine.export(mission));
    expect(imported.ok).toBe(true); expect(imported.mission?.title).toContain("가져옴");
  });
  it("returns easy errors for invalid files", () => {
    expect(engine.import({ version: 99 }).errors.length).toBeGreaterThan(0);
  });
});
