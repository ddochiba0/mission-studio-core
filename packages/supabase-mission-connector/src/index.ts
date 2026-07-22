import { createClient } from "@supabase/supabase-js";
import type { MissionDefinition, MissionId } from "@mission-studio/core";
import type { MissionRemoteConnector } from "@mission-studio/sync-engine";

interface QueryResult { readonly error: { readonly message: string } | null; }
interface MissionTable {
  upsert(row: Record<string, unknown>, options: { onConflict: string }): PromiseLike<QueryResult>;
  delete(): { eq(column: string, value: string): PromiseLike<QueryResult> };
}
interface SupabaseLike { from(table: string): MissionTable; }

export class SupabaseMissionConnector implements MissionRemoteConnector {
  public constructor(private readonly client: SupabaseLike, private readonly table = "missions") {}

  public async upsert(mission: MissionDefinition): Promise<void> {
    const { error } = await this.client.from(this.table).upsert({
      id: mission.id,
      document: structuredClone(mission),
      updated_at: mission.updatedAt,
    }, { onConflict: "id" });
    if (error) throw new Error(`서버 저장 실패: ${error.message}`);
  }

  public async delete(id: MissionId): Promise<void> {
    const { error } = await this.client.from(this.table).delete().eq("id", id);
    if (error) throw new Error(`서버 삭제 실패: ${error.message}`);
  }
}

export function createSupabaseMissionConnector(url: string, publishableKey: string): SupabaseMissionConnector {
  if (!url || !publishableKey) throw new Error("Supabase 프로젝트 주소와 Publishable Key가 필요합니다.");
  return new SupabaseMissionConnector(createClient(url, publishableKey) as unknown as SupabaseLike);
}
