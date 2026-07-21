import type { MissionDefinition, MissionEvaluation, MissionProgress } from "@mission-studio/core";

export class CompletionEngine {
  public evaluate(mission: MissionDefinition, progress: MissionProgress): MissionEvaluation {
    const validIds = new Set(mission.checkpoints.map((checkpoint) => checkpoint.id));
    const completed = [...new Set(progress.completedCheckpointIds.filter((id) => validIds.has(id)))];
    const requiredCount = mission.rules.completion.mode === "all"
      ? mission.checkpoints.length
      : mission.rules.completion.requiredCount;
    const violations: string[] = [];

    if (mission.rules.completion.enforceOrder) {
      const expected = mission.checkpoints.slice(0, completed.length).map((checkpoint) => checkpoint.id);
      if (completed.some((id, index) => id !== expected[index])) violations.push("CHECKPOINT_ORDER_VIOLATION");
    }

    const next = mission.checkpoints.find((checkpoint) => !completed.includes(checkpoint.id));
    return {
      completed: completed.length >= requiredCount && violations.length === 0,
      completedCount: completed.length,
      requiredCount,
      nextCheckpointId: next?.id ?? null,
      violations,
    };
  }
}

export type * from "@mission-studio/core";
