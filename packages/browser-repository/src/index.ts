import type { MissionDefinition, MissionId, MissionRepository } from "@mission-studio/core";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface MissionStoreV2 {
  readonly schemaVersion: 2;
  readonly missions: readonly MissionDefinition[];
}

export class BrowserMissionRepository implements MissionRepository {
  public constructor(
    private readonly storage: StorageLike,
    private readonly storageKey = "mission-studio:missions",
  ) {}

  public async list(): Promise<readonly MissionDefinition[]> {
    return this.read().missions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  public async findById(id: MissionId): Promise<MissionDefinition | null> {
    return this.read().missions.find((mission) => mission.id === id) ?? null;
  }

  public async save(mission: MissionDefinition): Promise<void> {
    const current = this.read();
    const missions = current.missions.filter((item) => item.id !== mission.id);
    missions.push(structuredClone(mission));
    this.write({ schemaVersion: 2, missions });
  }

  public async delete(id: MissionId): Promise<boolean> {
    const current = this.read();
    const missions = current.missions.filter((mission) => mission.id !== id);
    if (missions.length === current.missions.length) return false;
    this.write({ schemaVersion: 2, missions });
    return true;
  }

  private read(): { schemaVersion: 2; missions: MissionDefinition[] } {
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) return { schemaVersion: 2, missions: [] };
    const value: unknown = JSON.parse(raw);
    if (isStoreV2(value)) return { schemaVersion: 2, missions: [...structuredClone(value.missions)] };
    if (isStoreV1(value)) {
      const missions = value.missions.map((mission) => ({
        ...mission,
        rules: { completion: { mode: "all" as const, requiredCount: 0, enforceOrder: false }, reward: { enabled: false, title: "", description: "" } },
      }));
      const migrated = { schemaVersion: 2 as const, missions };
      this.write(migrated);
      return migrated;
    }
    throw new Error("Unsupported or damaged Mission Studio storage.");
  }

  private write(store: MissionStoreV2): void {
    this.storage.setItem(this.storageKey, JSON.stringify(store));
  }
}

function isStoreV2(value: unknown): value is MissionStoreV2 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MissionStoreV2>;
  return candidate.schemaVersion === 2 && Array.isArray(candidate.missions);
}

function isStoreV1(value: unknown): value is { schemaVersion: 1; missions: Array<Omit<MissionDefinition, "rules">> } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { schemaVersion?: unknown; missions?: unknown };
  return candidate.schemaVersion === 1 && Array.isArray(candidate.missions);
}
