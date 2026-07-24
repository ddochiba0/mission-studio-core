export interface AuthUser {
  readonly id: string;
  readonly email: string;
}

export interface AuthSession {
  readonly user: AuthUser;
}

export type AuthState =
  | { readonly status: "signed_out"; readonly session: null }
  | { readonly status: "signed_in"; readonly session: AuthSession };

export interface AuthConnector {
  current(): Promise<AuthSession | null>;
  signIn(credentials: { readonly email: string; readonly password: string }): Promise<AuthSession>;
  signOut(): Promise<void>;
  updatePassword(password: string): Promise<void>;
  subscribe(listener: (session: AuthSession | null) => void): () => void;
  onPasswordRecovery(listener: () => void): () => void;
}

export class AuthEngine {
  public constructor(private readonly connector: AuthConnector) {}

  public async current(): Promise<AuthState> {
    return toState(await this.connector.current());
  }

  public async signIn(email: string, password: string): Promise<AuthState> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) throw new Error("이메일과 비밀번호를 입력하세요.");
    return toState(await this.connector.signIn({ email: normalizedEmail, password }));
  }

  public async signOut(): Promise<AuthState> {
    await this.connector.signOut();
    return { status: "signed_out", session: null };
  }

  public async updatePassword(password: string, confirmation: string): Promise<void> {
    if (password.length < 8) throw new Error("새 비밀번호는 8자 이상 입력하세요.");
    if (password !== confirmation) throw new Error("새 비밀번호 확인이 일치하지 않습니다.");
    await this.connector.updatePassword(password);
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    return this.connector.subscribe((session) => listener(toState(session)));
  }

  public onPasswordRecovery(listener: () => void): () => void {
    return this.connector.onPasswordRecovery(listener);
  }
}

function toState(session: AuthSession | null): AuthState {
  return session ? { status: "signed_in", session } : { status: "signed_out", session: null };
}
