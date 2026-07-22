import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthConnector, AuthSession } from "@mission-studio/auth-engine";

export class SupabaseAuthAdapter implements AuthConnector {
  public constructor(private readonly client: SupabaseClient) {}

  public async current(): Promise<AuthSession | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw new Error(`로그인 상태 확인 실패: ${error.message}`);
    return mapSession(data.session);
  }

  public async signIn(credentials: { email: string; password: string }): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signInWithPassword(credentials);
    if (error) throw new Error(`로그인 실패: ${friendlyMessage(error.message)}`);
    const session = mapSession(data.session);
    if (!session) throw new Error("로그인 정보를 확인하지 못했습니다. 다시 로그인하세요.");
    return session;
  }

  public async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw new Error(`로그아웃 실패: ${error.message}`);
  }

  public subscribe(listener: (session: AuthSession | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => listener(mapSession(session)));
    return () => data.subscription.unsubscribe();
  }
}

export function createSupabaseClient(url: string, publishableKey: string): SupabaseClient {
  if (!url || !publishableKey) throw new Error("Supabase 프로젝트 주소와 Publishable Key가 필요합니다.");
  return createClient(url, publishableKey);
}

function mapSession(session: { user: { id: string; email?: string } } | null): AuthSession | null {
  if (!session) return null;
  return { user: { id: session.user.id, email: session.user.email ?? "이메일 미확인" } };
}

function friendlyMessage(message: string): string {
  if (/invalid login credentials/i.test(message)) return "이메일 또는 비밀번호가 맞지 않습니다.";
  if (/email not confirmed/i.test(message)) return "이메일 확인을 먼저 완료하세요.";
  return message;
}
