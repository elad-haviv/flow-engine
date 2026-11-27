import { describe, expect, it } from "vitest";
import { newId } from "../src/ids";

describe("newId", () => {
  it("is 26 chars and sorts by time", () => {
    let t = 1_700_000_000_000;
    const src = { now: () => t, random: () => 0.5 };
    const a = newId(src);
    t += 1000;
    const b = newId(src);
    expect(a).toHaveLength(26);
    expect(a < b).toBe(true);
  });
  it("never repeats across 100,000 calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100_000; i++) seen.add(newId());
    expect(seen.size).toBe(100_000);
  });
  it("is reproducible with injected sources", () => {
    const mk = () => {
      let i = 0;
      return { now: () => 5, random: () => ((i++ * 7) % 32) / 32 };
    };
    expect(newId(mk())).toBe(newId(mk()));
  });
});
