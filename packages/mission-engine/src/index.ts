import type {
  CreateMissionInput,
  MissionDefinition,
  MissionId,
  MissionRepository,
  MissionCheckpoint,
  ValidationIssue,
  ValidationResult,
} from "@mission-studio/core";

export interface MissionEngineDependencies {
  readonly createId: () => string;
  readonly now: () => Date;
}

export class MissionEngine {
  public constructor(private readonly dependencies: MissionEngineDependencies) {}

  public create(input: CreateMissionInput): MissionDefinition {
    const timestamp = this.dependencies.now().toISOString();

    return {
      id: this.dependencies.createId() as MissionId,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      status: "draft",
      checkpoints: [...(input.checkpoints ?? [])].sort((a, b) => a.sequence - b.sequence),
      tags: [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))],
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: { ...(input.metadata ?? {}) },
      rules: input.rules ?? defaultMissionRules(),
    };
  }

  public validate(mission: MissionDefinition): ValidationResult {
    const issues: ValidationIssue[] = [];

    if (!mission.title) {
      issues.push({ code: "TITLE_REQUIRED", path: "title", message: "Mission title is required." });
    }

    mission.checkpoints.forEach((checkpoint, index) => {
      const { latitude, longitude } = checkpoint.position;
      if (latitude < -90 || latitude > 90) {
        issues.push({ code: "LATITUDE_OUT_OF_RANGE", path: `checkpoints.${index}.position.latitude`, message: "Latitude must be between -90 and 90." });
      }
      if (longitude < -180 || longitude > 180) {
        issues.push({ code: "LONGITUDE_OUT_OF_RANGE", path: `checkpoints.${index}.position.longitude`, message: "Longitude must be between -180 and 180." });
      }
    });

    return { valid: issues.length === 0, issues };
  }

  public update(mission: MissionDefinition, changes: Partial<Pick<CreateMissionInput, "title" | "description" | "tags" | "metadata">>): MissionDefinition {
    return {
      ...mission,
      title: changes.title === undefined ? mission.title : changes.title.trim(),
      description: changes.description === undefined ? mission.description : changes.description.trim(),
      tags: changes.tags === undefined ? mission.tags : [...new Set(changes.tags.map((tag) => tag.trim()).filter(Boolean))],
      metadata: changes.metadata === undefined ? mission.metadata : { ...changes.metadata },
      updatedAt: this.dependencies.now().toISOString(),
    };
  }

  public transition(mission: MissionDefinition, target: MissionDefinition["status"]): MissionDefinition {
    const allowed: Record<MissionDefinition["status"], readonly MissionDefinition["status"][]> = {
      draft: ["published"],
      published: ["draft", "archived"],
      archived: ["draft"],
    };
    if (!allowed[mission.status].includes(target)) throw new Error(`Invalid mission transition: ${mission.status} -> ${target}`);
    if (target === "published" && mission.checkpoints.length === 0) throw new Error("A mission needs at least one checkpoint before publishing.");
    const validation = this.validate(mission);
    if (!validation.valid) throw new MissionValidationError(validation);
    return { ...mission, status: target, updatedAt: this.dependencies.now().toISOString() };
  }

  public updateRules(mission: MissionDefinition, rules: MissionDefinition["rules"]): MissionDefinition {
    const maximum = mission.checkpoints.length;
    if (!Number.isInteger(rules.completion.requiredCount) || rules.completion.requiredCount < 0) throw new Error("Required checkpoint count must be a non-negative integer.");
    if (rules.completion.mode === "at_least" && rules.completion.requiredCount > maximum) throw new Error("Required checkpoint count cannot exceed available checkpoints.");
    return { ...mission, rules: structuredClone(rules), updatedAt: this.dependencies.now().toISOString() };
  }

  public addCheckpoint(mission: MissionDefinition, checkpoint: MissionCheckpoint): MissionDefinition {
    return this.withCheckpoints(mission, [...mission.checkpoints, checkpoint]);
  }

  public removeCheckpoint(mission: MissionDefinition, checkpointId: string): MissionDefinition {
    return this.withCheckpoints(mission, mission.checkpoints.filter((item) => item.id !== checkpointId));
  }

  public reorderCheckpoints(mission: MissionDefinition, checkpointIds: readonly string[]): MissionDefinition {
    const byId = new Map(mission.checkpoints.map((checkpoint) => [checkpoint.id, checkpoint]));
    const reordered = checkpointIds.map((id, index) => {
      const checkpoint = byId.get(id);
      if (!checkpoint) throw new Error(`Unknown checkpoint: ${id}`);
      return { ...checkpoint, sequence: index + 1 };
    });
    if (reordered.length !== mission.checkpoints.length) throw new Error("Every checkpoint must be included exactly once.");
    return this.withCheckpoints(mission, reordered);
  }

  private withCheckpoints(mission: MissionDefinition, checkpoints: readonly MissionCheckpoint[]): MissionDefinition {
    return {
      ...mission,
      checkpoints: [...checkpoints].sort((a, b) => a.sequence - b.sequence),
      updatedAt: this.dependencies.now().toISOString(),
    };
  }
}

export class MissionService {
  public constructor(private readonly engine: MissionEngine, private readonly repository: MissionRepository) {}

  public list(): Promise<readonly MissionDefinition[]> {
    return this.repository.list();
  }

  public async create(input: CreateMissionInput): Promise<MissionDefinition> {
    const mission = this.engine.create(input);
    const validation = this.engine.validate(mission);
    if (!validation.valid) throw new MissionValidationError(validation);
    await this.repository.save(mission);
    return mission;
  }

  public async update(id: MissionId, changes: Partial<Pick<CreateMissionInput, "title" | "description" | "tags" | "metadata">>): Promise<MissionDefinition> {
    const current = await this.repository.findById(id);
    if (!current) throw new Error(`Mission not found: ${id}`);
    const updated = this.engine.update(current, changes);
    const validation = this.engine.validate(updated);
    if (!validation.valid) throw new MissionValidationError(validation);
    await this.repository.save(updated);
    return updated;
  }

  public delete(id: MissionId): Promise<boolean> {
    return this.repository.delete(id);
  }

  public async addCheckpoint(id: MissionId, checkpoint: MissionCheckpoint): Promise<MissionDefinition> {
    const current = await this.requireMission(id);
    const updated = this.engine.addCheckpoint(current, checkpoint);
    const validation = this.engine.validate(updated);
    if (!validation.valid) throw new MissionValidationError(validation);
    await this.repository.save(updated);
    return updated;
  }

  public async removeCheckpoint(id: MissionId, checkpointId: string): Promise<MissionDefinition> {
    const current = await this.requireMission(id);
    const updated = this.engine.removeCheckpoint(current, checkpointId);
    await this.repository.save(updated);
    return updated;
  }

  public async reorderCheckpoints(id: MissionId, checkpointIds: readonly string[]): Promise<MissionDefinition> {
    const current = await this.requireMission(id);
    const updated = this.engine.reorderCheckpoints(current, checkpointIds);
    await this.repository.save(updated);
    return updated;
  }

  public async transition(id: MissionId, target: MissionDefinition["status"]): Promise<MissionDefinition> {
    const current = await this.requireMission(id);
    const updated = this.engine.transition(current, target);
    await this.repository.save(updated);
    return updated;
  }

  public async updateRules(id: MissionId, rules: MissionDefinition["rules"]): Promise<MissionDefinition> {
    const current = await this.requireMission(id);
    const updated = this.engine.updateRules(current, rules);
    await this.repository.save(updated);
    return updated;
  }

  private async requireMission(id: MissionId): Promise<MissionDefinition> {
    const mission = await this.repository.findById(id);
    if (!mission) throw new Error(`Mission not found: ${id}`);
    return mission;
  }
}

export class MissionValidationError extends Error {
  public constructor(public readonly result: ValidationResult) {
    super(result.issues.map((issue) => issue.message).join(" "));
    this.name = "MissionValidationError";
  }
}

export function defaultMissionRules(): MissionDefinition["rules"] {
  return {
    completion: { mode: "all", requiredCount: 0, enforceOrder: false },
    reward: { enabled: false, title: "", description: "" },
  };
}

export type * from "@mission-studio/core";
