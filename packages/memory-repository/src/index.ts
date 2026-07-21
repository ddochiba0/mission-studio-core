import type { MissionDefinition, MissionId, MissionRepository } from "@mission-studio/core";

export class InMemoryMissionRepository implements MissionRepository {
  private readonly missions = new Map<MissionId, MissionDefinition>();

  public async list(): Promise<readonly MissionDefinition[]> {
    return [...this.missions.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  public async findById(id: MissionId): Promise<MissionDefinition | null> {
    return this.missions.get(id) ?? null;
  }

  public async save(mission: MissionDefinition): Promise<void> {
    this.missions.set(mission.id, structuredClone(mission));
  }

  public async delete(id: MissionId): Promise<boolean> {
    return this.missions.delete(id);
  }
}
