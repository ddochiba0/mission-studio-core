import { describe, expect, it } from "vitest";
import { BrowserSyncQueue } from "./index.js";
class Storage { value: string | null = null; getItem() { return this.value; } setItem(_key: string, value: string) { this.value = value; } }
describe("BrowserSyncQueue", () => {
  it("keeps delete work across queue instances", async () => {
    const storage = new Storage(); const queue = new BrowserSyncQueue(storage);
    await queue.put({ id: "1", type: "delete", missionId: "mission" as never, queuedAt: "2026-07-22T00:00:00.000Z", attempts: 0 });
    expect(await new BrowserSyncQueue(storage).list()).toHaveLength(1);
    await queue.remove("1"); expect(await queue.list()).toHaveLength(0);
  });
});
