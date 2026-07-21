import { describe, expect, it } from "vitest";
import type { MissionDefinition, MissionId } from "@mission-studio/core";
import { CompletionEngine } from "./index.js";

const mission: MissionDefinition = {
  id: "mission" as MissionId, title: "Trail", description: "", status: "published", tags: [], metadata: {},
  createdAt: "2026-07-22T00:00:00.000Z", updatedAt: "2026-07-22T00:00:00.000Z",
  checkpoints: [
    { id: "a", title: "A", sequence: 1, position: { latitude: 35, longitude: 127 } },
    { id: "b", title: "B", sequence: 2, position: { latitude: 36, longitude: 128 } },
  ],
  rules: { completion: { mode: "all", requiredCount: 0, enforceOrder: true }, reward: { enabled: true, title: "Badge", description: "Finished" } },
};

describe("CompletionEngine", () => {
  it("completes an ordered mission", () => expect(new CompletionEngine().evaluate(mission, { completedCheckpointIds: ["a", "b"] }).completed).toBe(true));
  it("detects an order violation", () => expect(new CompletionEngine().evaluate(mission, { completedCheckpointIds: ["b"] }).violations).toContain("CHECKPOINT_ORDER_VIOLATION"));
});
