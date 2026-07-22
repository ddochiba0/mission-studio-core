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
  subscribe(listener: (session: AuthSession | null) => void): () => void;
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

  public subscribe(listener: (state: AuthState) => void): () => void {
    return this.connector.subscribe((session) => listener(toState(session)));
  }
}

function toState(session: AuthSession | null): AuthState {
  return session ? { status: "signed_in", session } : { status: "signed_out", session: null };
}
