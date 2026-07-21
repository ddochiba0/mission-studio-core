import { describe, expect, it } from "vitest";
import { MissionEngine } from "./index.js";

const engine = new MissionEngine({
  createId: () => "mission-001",
  now: () => new Date("2026-07-22T00:00:00.000Z"),
});

describe("MissionEngine", () => {
  it("creates a project-agnostic draft mission", () => {
    const mission = engine.create({ title: "  Riverside walk  ", tags: ["outdoor", "outdoor"] });

    expect(mission.id).toBe("mission-001");
    expect(mission.title).toBe("Riverside walk");
    expect(mission.status).toBe("draft");
    expect(mission.tags).toEqual(["outdoor"]);
  });

  it("reports invalid coordinates without knowing an application type", () => {
    const mission = engine.create({
      title: "Route",
      checkpoints: [{ id: "point-1", title: "Start", sequence: 1, position: { latitude: 91, longitude: 181 } }],
    });

    expect(engine.validate(mission)).toEqual({
      valid: false,
      issues: [
        expect.objectContaining({ code: "LATITUDE_OUT_OF_RANGE" }),
        expect.objectContaining({ code: "LONGITUDE_OUT_OF_RANGE" }),
      ],
    });
  });

  it("adds, removes and reorders checkpoints immutably", () => {
    const first = { id: "first", title: "First", sequence: 1, position: { latitude: 35, longitude: 127 } };
    const second = { id: "second", title: "Second", sequence: 2, position: { latitude: 36, longitude: 128 } };
    const mission = engine.create({ title: "Route", checkpoints: [first] });
    const withSecond = engine.addCheckpoint(mission, second);
    const reordered = engine.reorderCheckpoints(withSecond, ["second", "first"]);
    const removed = engine.removeCheckpoint(reordered, "first");

    expect(mission.checkpoints).toHaveLength(1);
    expect(reordered.checkpoints.map((item) => item.id)).toEqual(["second", "first"]);
    expect(removed.checkpoints.map((item) => item.id)).toEqual(["second"]);
  });

  it("requires a checkpoint before publishing", () => {
    const empty = engine.create({ title: "Empty" });
    expect(() => engine.transition(empty, "published")).toThrow("at least one checkpoint");
    const ready = engine.addCheckpoint(empty, { id: "one", title: "One", sequence: 1, position: { latitude: 35, longitude: 127 } });
    expect(engine.transition(ready, "published").status).toBe("published");
  });

  it("validates configurable completion rules", () => {
    const mission = engine.create({ title: "Rules", checkpoints: [{ id: "one", title: "One", sequence: 1, position: { latitude: 35, longitude: 127 } }] });
    expect(() => engine.updateRules(mission, { ...mission.rules, completion: { mode: "at_least", requiredCount: 2, enforceOrder: false } })).toThrow("cannot exceed");
  });
});
