import { describe, expect, it } from "vitest";
import { append, JOURNAL_LIMIT } from "../src";
import { cmd } from "./helpers";

describe("journal", () => {
  it("appends in order", () => {
    const a = cmd("project.rename", { name: "a" });
    const b = cmd("project.rename", { name: "b" });
    expect(append(append([], a), b).map((c) => c.id)).toEqual([a.id, b.id]);
  });
  it("keeps the last 5000 commands", () => {
    let j = [] as ReturnType<typeof append>;
    const first = cmd("project.rename", { name: "first" });
    j = append(j, first);
    for (let i = 0; i < JOURNAL_LIMIT; i++) j = append(j, cmd("project.rename", { name: String(i) }));
    expect(j).toHaveLength(JOURNAL_LIMIT);
    expect(j.some((c) => c.id === first.id)).toBe(false);
    expect(JOURNAL_LIMIT).toBe(5000);
  });
  it("does not drop below the limit", () => {
    let j = [] as ReturnType<typeof append>;
    for (let i = 0; i < 100; i++) j = append(j, cmd("project.rename", { name: String(i) }));
    expect(j).toHaveLength(100);
  });
});
