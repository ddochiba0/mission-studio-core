import test from "node:test";
import assert from "node:assert/strict";
import { validateEnvironment } from "./check-environment.mjs";

test("accepts the documented empty environment template", () => {
  assert.deepEqual(validateEnvironment("VITE_SUPABASE_URL=\nVITE_SUPABASE_PUBLISHABLE_KEY=\n"), []);
});

test("rejects a secret server key in a browser environment", () => {
  const errors = validateEnvironment("VITE_SUPABASE_URL=https://demo.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=service_role_secret\n");
  assert.equal(errors.length, 1);
});

test("reports missing required names", () => {
  assert.equal(validateEnvironment("").length, 2);
});

test("requires real values for a deployment environment", () => {
  assert.equal(validateEnvironment("VITE_SUPABASE_URL=\nVITE_SUPABASE_PUBLISHABLE_KEY=\n", { requireValues: true }).length, 2);
});
