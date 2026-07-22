import type { MissionDefinition, MissionId, MissionRepository } from "@mission-studio/core";

export type SyncOperation =
  | { readonly id: string; readonly type: "upsert"; readonly mission: MissionDefinition; readonly queuedAt: string; readonly attempts: number; readonly force?: boolean }
  | { readonly id: string; readonly type: "delete"; readonly missionId: MissionId; readonly queuedAt: string; readonly attempts: number; readonly force?: boolean };

export interface SyncQueue {
  list(): Promise<readonly SyncOperation[]>;
  put(operation: SyncOperation): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface MissionRemoteConnector {
  upsert(mission: MissionDefinition): Promise<void>;
  delete(id: MissionId): Promise<void>;
}

export type RemoteMissionSnapshot =
  | { readonly id: MissionId; readonly state: "active"; readonly mission: MissionDefinition; readonly updatedAt: string }
  | { readonly id: MissionId; readonly state: "deleted"; readonly updatedAt: string };

export interface MissionRemoteReader {
  listSnapshots(): Promise<readonly RemoteMissionSnapshot[]>;
}

export interface PullReport {
  readonly downloaded: number;
  readonly deleted: number;
  readonly conflicts: readonly SyncConflict[];
}

export interface SyncConflict {
  readonly missionId: MissionId;
  readonly local: MissionDefinition | null;
  readonly remote: RemoteMissionSnapshot;
}

export interface SynchronizationReport {
  readonly pull: PullReport;
  readonly upload: SyncReport | null;
}

export interface SyncReport {
  readonly state: "synced" | "pending" | "error";
  readonly completed: number;
  readonly pending: number;
  readonly errors: readonly string[];
}

export interface SyncEngineDependencies {
  readonly createId: () => string;
  readonly now: () => Date;
}

export class SyncEngine {
  public constructor(
    private readonly queue: SyncQueue,
    private readonly remote: MissionRemoteConnector,
  ) {}

  public async flush(): Promise<SyncReport> {
    const operations = await this.queue.list();
    let completed = 0;
    const errors: string[] = [];
    for (const operation of operations) {
      try {
        if (operation.type === "upsert") await this.remote.upsert(operation.mission);
        else await this.remote.delete(operation.missionId);
        await this.queue.remove(operation.id);
        completed += 1;
      } catch (error) {
        await this.queue.put({ ...operation, attempts: operation.attempts + 1 });
        errors.push(error instanceof Error ? error.message : "서버 동기화에 실패했습니다.");
      }
    }
    const pending = (await this.queue.list()).length;
    return { state: errors.length ? "error" : pending ? "pending" : "synced", completed, pending, errors };
  }
}

export class MissionPullEngine {
  public constructor(
    private readonly local: MissionRepository,
    private readonly queue: SyncQueue,
    private readonly remote: MissionRemoteReader,
  ) {}

  public async pull(): Promise<PullReport> {
    const [snapshots, pending] = await Promise.all([this.remote.listSnapshots(), this.queue.list()]);
    let downloaded = 0; let deleted = 0; const conflicts: SyncConflict[] = [];
    for (const snapshot of snapshots) {
      const local = await this.local.findById(snapshot.id);
      const localChange = pending.find((operation) => operation.type === "upsert" ? operation.mission.id === snapshot.id : operation.missionId === snapshot.id);
      if (localChange) {
        const localUpdatedAt = localChange.type === "upsert" ? localChange.mission.updatedAt : localChange.queuedAt;
        if (!localChange.force && snapshot.updatedAt > localUpdatedAt) conflicts.push({ missionId: snapshot.id, local: local ? structuredClone(local) : null, remote: structuredClone(snapshot) });
        continue;
      }
      if (snapshot.state === "deleted") {
        if (local && snapshot.updatedAt >= local.updatedAt && await this.local.delete(snapshot.id)) deleted += 1;
        continue;
      }
      if (!local || snapshot.updatedAt > local.updatedAt) {
        await this.local.save(structuredClone(snapshot.mission)); downloaded += 1;
      }
    }
    return { downloaded, deleted, conflicts };
  }
}

export class BidirectionalSyncEngine {
  public constructor(private readonly pullEngine: MissionPullEngine, private readonly syncEngine: SyncEngine) {}

  public async synchronize(): Promise<SynchronizationReport> {
    const pull = await this.pullEngine.pull();
    if (pull.conflicts.length) return { pull, upload: null };
    return { pull, upload: await this.syncEngine.flush() };
  }
}

export class SyncConflictResolver {
  public constructor(private readonly local: MissionRepository, private readonly queue: SyncQueue) {}

  public async resolve(conflict: SyncConflict, choice: "keep_local" | "use_remote"): Promise<void> {
    const operations = await this.queue.list();
    const matching = operations.filter((operation) => operation.type === "upsert" ? operation.mission.id === conflict.missionId : operation.missionId === conflict.missionId);
    if (choice === "keep_local") {
      for (const operation of matching) await this.queue.put({ ...operation, force: true });
      return;
    }
    for (const operation of matching) await this.queue.remove(operation.id);
    if (conflict.remote.state === "active") await this.local.save(structuredClone(conflict.remote.mission));
    else await this.local.delete(conflict.missionId);
  }
}

export class SyncingMissionRepository implements MissionRepository {
  public constructor(
    private readonly local: MissionRepository,
    private readonly queue: SyncQueue,
    private readonly dependencies: SyncEngineDependencies,
  ) {}

  public list() { return this.local.list(); }
  public findById(id: MissionId) { return this.local.findById(id); }

  public async save(mission: MissionDefinition): Promise<void> {
    await this.local.save(mission);
    for (const pending of await this.queue.list()) {
      if (pending.type === "upsert" && pending.mission.id === mission.id) await this.queue.remove(pending.id);
    }
    await this.queue.put({ id: this.dependencies.createId(), type: "upsert", mission: structuredClone(mission), queuedAt: this.dependencies.now().toISOString(), attempts: 0 });
  }

  public async delete(id: MissionId): Promise<boolean> {
    const deleted = await this.local.delete(id);
    if (deleted) {
      for (const pending of await this.queue.list()) {
        const matches = pending.type === "upsert" ? pending.mission.id === id : pending.missionId === id;
        if (matches) await this.queue.remove(pending.id);
      }
      await this.queue.put({ id: this.dependencies.createId(), type: "delete", missionId: id, queuedAt: this.dependencies.now().toISOString(), attempts: 0 });
    }
    return deleted;
  }
}

export type * from "@mission-studio/core";
