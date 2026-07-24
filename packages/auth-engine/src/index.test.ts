import { describe, expect, it } from "vitest";
import { AuthEngine, type AuthConnector, type AuthSession } from "./index.js";

const session: AuthSession = { user: { id: "user-1", email: "owner@example.com" } };

class Connector implements AuthConnector {
  signedInWith: { email: string; password: string } | null = null;
  updatedPassword: string | null = null;
  async current() { return null; }
  async signIn(credentials: { email: string; password: string }) { this.signedInWith = credentials; return session; }
  async signOut() {}
  async updatePassword(password: string) { this.updatedPassword = password; }
  subscribe() { return () => {}; }
  onPasswordRecovery() { return () => {}; }
}

describe("AuthEngine", () => {
  it("normalizes an email before delegating sign in", async () => {
    const connector = new Connector();
    const state = await new AuthEngine(connector).signIn(" OWNER@Example.COM ", "secret");
    expect(connector.signedInWith?.email).toBe("owner@example.com");
    expect(state.status).toBe("signed_in");
  });

  it("rejects incomplete credentials before calling a connector", async () => {
    await expect(new AuthEngine(new Connector()).signIn("", "")).rejects.toThrow("이메일과 비밀번호");
  });

  it("validates and delegates a password update", async () => {
    const connector = new Connector();
    await new AuthEngine(connector).updatePassword("new-password", "new-password");
    expect(connector.updatedPassword).toBe("new-password");
  });

  it("rejects a short or mismatched recovery password", async () => {
    const engine = new AuthEngine(new Connector());
    await expect(engine.updatePassword("short", "short")).rejects.toThrow("8자 이상");
    await expect(engine.updatePassword("new-password", "other-password")).rejects.toThrow("일치하지 않습니다");
  });
});
