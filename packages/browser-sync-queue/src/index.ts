import type { SyncOperation, SyncQueue } from "@mission-studio/sync-engine";

interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; }

export class BrowserSyncQueue implements SyncQueue {
  public constructor(private readonly storage: StorageLike, private readonly key = "mission-studio:sync-queue") {}
  public async list(): Promise<readonly SyncOperation[]> { return this.read(); }
  public async put(operation: SyncOperation): Promise<void> {
    const operations = this.read().filter((item) => item.id !== operation.id);
    this.write([...operations, structuredClone(operation)]);
  }
  public async remove(id: string): Promise<void> { this.write(this.read().filter((item) => item.id !== id)); }
  private read(): SyncOperation[] {
    const raw = this.storage.getItem(this.key); if (!raw) return [];
    const value: unknown = JSON.parse(raw); if (!Array.isArray(value)) throw new Error("임시저장 목록이 손상되었습니다.");
    return structuredClone(value) as SyncOperation[];
  }
  private write(operations: readonly SyncOperation[]) { this.storage.setItem(this.key, JSON.stringify(operations)); }
}
