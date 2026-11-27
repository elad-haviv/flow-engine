import { describe, expect, it } from "vitest";
import { fromSI, toSI } from "../src/units";

describe("units", () => {
  it("round-trips within 1e-12 relative", () => {
    for (const u of ["kV", "mΩ", "kVA", "mm", "ms", "MW"]) {
      const q = toSI(3.7, u);
      expect(Math.abs(fromSI(q, u) - 3.7) / 3.7).toBeLessThan(1e-12);
    }
  });
  it("rejects unknown units", () => {
    expect(() => toSI(1, "furlong")).toThrow();
  });
});
