export type MissionId = string & { readonly __brand: "MissionId" };

export type MissionStatus = "draft" | "published" | "archived";

export interface Coordinate {
  readonly latitude: number;
  readonly longitude: number;
}

export interface MissionCheckpoint {
  readonly id: string;
  readonly title: string;
  readonly position: Coordinate;
  readonly sequence: number;
}

export interface MissionDefinition {
  readonly id: MissionId;
  readonly title: string;
  readonly description: string;
  readonly status: MissionStatus;
  readonly checkpoints: readonly MissionCheckpoint[];
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly rules: MissionRuleSet;
}

export interface MissionRuleSet {
  readonly completion: {
    readonly mode: "all" | "at_least";
    readonly requiredCount: number;
    readonly enforceOrder: boolean;
  };
  readonly reward: {
    readonly enabled: boolean;
    readonly title: string;
    readonly description: string;
  };
}

export interface MissionProgress {
  readonly completedCheckpointIds: readonly string[];
}

export interface MissionEvaluation {
  readonly completed: boolean;
  readonly completedCount: number;
  readonly requiredCount: number;
  readonly nextCheckpointId: string | null;
  readonly violations: readonly string[];
}

export interface CreateMissionInput {
  readonly title: string;
  readonly description?: string;
  readonly checkpoints?: readonly MissionCheckpoint[];
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly rules?: MissionRuleSet;
}

export interface ValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

export interface MissionRepository {
  list(): Promise<readonly MissionDefinition[]>;
  findById(id: MissionId): Promise<MissionDefinition | null>;
  save(mission: MissionDefinition): Promise<void>;
  delete(id: MissionId): Promise<boolean>;
}
