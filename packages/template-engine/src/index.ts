import type { MissionDefinition, MissionId } from "@mission-studio/core";

export interface MissionExchangeDocument {
  readonly format: "sia.mission";
  readonly version: 1;
  readonly exportedAt: string;
  readonly mission: MissionDefinition;
}

export interface TemplateEngineDependencies {
  readonly createId: () => string;
  readonly now: () => Date;
}

export interface ImportResult {
  readonly ok: boolean;
  readonly mission?: MissionDefinition;
  readonly errors: readonly string[];
}

export class TemplateEngine {
  public constructor(private readonly dependencies: TemplateEngineDependencies) {}

  public duplicate(source: MissionDefinition, title = `${source.title} 복사본`): MissionDefinition {
    const timestamp = this.dependencies.now().toISOString();
    return {
      ...structuredClone(source),
      id: this.dependencies.createId() as MissionId,
      title: title.trim(),
      status: "draft",
      checkpoints: source.checkpoints.map((checkpoint) => ({ ...structuredClone(checkpoint), id: this.dependencies.createId() })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  public export(source: MissionDefinition): MissionExchangeDocument {
    return { format: "sia.mission", version: 1, exportedAt: this.dependencies.now().toISOString(), mission: structuredClone(source) };
  }

  public import(value: unknown): ImportResult {
    const errors: string[] = [];
    if (!value || typeof value !== "object") return { ok: false, errors: ["파일 내용이 올바른 JSON 객체가 아닙니다."] };
    const document = value as Partial<MissionExchangeDocument>;
    if (document.format !== "sia.mission") errors.push("SIA Mission 파일이 아닙니다.");
    if (document.version !== 1) errors.push("지원하지 않는 Mission 파일 버전입니다.");
    if (!isMission(document.mission)) errors.push("미션 필수 정보가 없거나 손상되었습니다.");
    if (errors.length > 0 || !document.mission) return { ok: false, errors };
    return { ok: true, errors: [], mission: this.duplicate(document.mission, `${document.mission.title} 가져옴`) };
  }
}

function isMission(value: unknown): value is MissionDefinition {
  if (!value || typeof value !== "object") return false;
  const mission = value as Partial<MissionDefinition>;
  return typeof mission.id === "string" && typeof mission.title === "string" && Array.isArray(mission.checkpoints)
    && !!mission.rules && typeof mission.rules === "object";
}

export type * from "@mission-studio/core";
