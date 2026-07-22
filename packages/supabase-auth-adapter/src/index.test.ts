import { describe, expect, it } from "vitest";
import { SupabaseAuthAdapter } from "./index.js";

describe("SupabaseAuthAdapter", () => {
  it("maps a Supabase session to the common auth contract", async () => {
    const client = { auth: { getSession: async () => ({ data: { session: { user: { id: "u1", email: "a@b.com" } } }, error: null }) } };
    const state = await new SupabaseAuthAdapter(client as never).current();
    expect(state?.user).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("returns an easy message for invalid credentials", async () => {
    const client = { auth: { signInWithPassword: async () => ({ data: { session: null }, error: { message: "Invalid login credentials" } }) } };
    await expect(new SupabaseAuthAdapter(client as never).signIn({ email: "a@b.com", password: "bad" })).rejects.toThrow("이메일 또는 비밀번호");
  });
});
