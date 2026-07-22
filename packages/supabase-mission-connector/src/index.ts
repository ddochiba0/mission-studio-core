import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MissionDefinition, MissionId } from "@mission-studio/core";
import type { MissionRemoteConnector, MissionRemoteReader, RemoteMissionSnapshot } from "@mission-studio/sync-engine";

interface QueryResult<T = unknown> { readonly data?: T; readonly error: { readonly message: string } | null; }
interface MissionTable {
  upsert(row: Record<string, unknown>, options: { onConflict: string }): PromiseLike<QueryResult>;
  update(row: Record<string, unknown>): { eq(column: string, value: string): PromiseLike<QueryResult> };
  select(columns: string): PromiseLike<QueryResult<readonly MissionRow[]>>;
}
interface SupabaseLike { from(table: string): MissionTable; }
interface MissionRow { readonly id: string; readonly document: MissionDefinition | null; readonly updated_at: string; readonly deleted_at: string | null; }

export class SupabaseMissionConnector implements MissionRemoteConnector, MissionRemoteReader {
  public constructor(private readonly client: SupabaseLike, private readonly table = "missions", private readonly now = () => new Date()) {}

  public async upsert(mission: MissionDefinition): Promise<void> {
    const { error } = await this.client.from(this.table).upsert({
      id: mission.id,
      document: structuredClone(mission),
      updated_at: mission.updatedAt,
      deleted_at: null,
    }, { onConflict: "id" });
    if (error) throw new Error(`서버 저장 실패: ${error.message}`);
  }

  public async delete(id: MissionId): Promise<void> {
    const deletedAt = this.now().toISOString();
    const { error } = await this.client.from(this.table).update({ document: null, deleted_at: deletedAt, updated_at: deletedAt }).eq("id", id);
    if (error) throw new Error(`서버 삭제 실패: ${error.message}`);
  }

  public async listSnapshots(): Promise<readonly RemoteMissionSnapshot[]> {
    const { data, error } = await this.client.from(this.table).select("id, document, updated_at, deleted_at");
    if (error) throw new Error(`서버 불러오기 실패: ${error.message}`);
    return (data ?? []).flatMap((row): RemoteMissionSnapshot[] => {
      if (row.deleted_at) return [{ id: row.id as MissionId, state: "deleted", updatedAt: row.deleted_at }];
      return row.document ? [{ id: row.id as MissionId, state: "active", mission: structuredClone(row.document), updatedAt: row.updated_at }] : [];
    });
  }
}

export function createSupabaseMissionConnector(url: string, publishableKey: string): SupabaseMissionConnector {
  if (!url || !publishableKey) throw new Error("Supabase 프로젝트 주소와 Publishable Key가 필요합니다.");
  return createSupabaseMissionConnectorFromClient(createClient(url, publishableKey));
}

export function createSupabaseMissionConnectorFromClient(client: SupabaseClient): SupabaseMissionConnector {
  return new SupabaseMissionConnector(client as unknown as SupabaseLike);
}
