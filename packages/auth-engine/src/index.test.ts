import { describe, expect, it } from "vitest";
import { AuthEngine, type AuthConnector, type AuthSession } from "./index.js";

const session: AuthSession = { user: { id: "user-1", email: "owner@example.com" } };

class Connector implements AuthConnector {
  signedInWith: { email: string; password: string } | null = null;
  async current() { return null; }
  async signIn(credentials: { email: string; password: string }) { this.signedInWith = credentials; return session; }
  async signOut() {}
  subscribe() { return () => {}; }
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
});
