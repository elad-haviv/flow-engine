import { DEFINITIONS } from "@flow/catalog";
import { describe, expect, it } from "vitest";
import { kindsWithoutSymbol, symbolFor, SYMBOLS } from "../src";

describe("symbols", () => {
  it("every catalog kind has a symbol and every symbol has a catalog kind", () => {
    expect(kindsWithoutSymbol()).toEqual([]);
    for (const k of Object.keys(SYMBOLS))
      expect(
        DEFINITIONS.some((d) => d.kind === k),
        k,
      ).toBe(true);
  });
  it("a symbol has an anchor for every terminal the catalog gives, and no others", () => {
    for (const d of DEFINITIONS)
      expect(Object.keys(symbolFor(d.kind)!.anchors).sort(), d.kind).toEqual([...d.terminals].sort());
  });
  it("anchors lie on the symbol's edge and face outward", () => {
    for (const [k, s] of Object.entries(SYMBOLS)) {
      for (const [role, a] of Object.entries(s.anchors)) {
        const onEdge = a!.p.x === 0 || a!.p.y === 0 || a!.p.x === s.w || a!.p.y === s.h || s.bar;
        expect(onEdge, `${k}.${role}`).toBe(true);
        if (!s.bar) {
          if (a!.side === "top") expect(a!.p.y).toBe(0);
          if (a!.side === "bottom") expect(a!.p.y).toBe(s.h);
          if (a!.side === "left") expect(a!.p.x).toBe(0);
          if (a!.side === "right") expect(a!.p.x).toBe(s.w);
        }
      }
    }
  });
  it("the busbar is the only bar", () => {
    expect(
      Object.entries(SYMBOLS)
        .filter(([, s]) => s.bar)
        .map(([k]) => k),
    ).toEqual(["busbar"]);
    expect(symbolFor("zzz")).toBeUndefined();
  });
});
