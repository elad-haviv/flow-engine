import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { indexedDbStorage } from "../src/storage/indexeddb";

describe("indexeddb storage", () => {
  it("saves, lists, loads, removes", async () => {
    const s = indexedDbStorage(new IDBFactory());
    const r1 = await s.save("a", "A", "text1");
    expect(r1).toBe("1");
    expect(await s.load("a")).toBe("text1");
    expect(await s.list()).toEqual([{ id: "a", name: "A", revision: "1" }]);
    await s.remove("a");
    expect(await s.load("a")).toBeUndefined();
  });
  it("detects a revision conflict", async () => {
    const s = indexedDbStorage(new IDBFactory());
    await s.save("a", "A", "1");
    await s.save("a", "A", "2", "1");
    await expect(s.save("a", "A", "3", "1")).rejects.toThrow("storage.revision_conflict");
  });
});
