import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { C, abs, conj, div, mul, polar, arg, add, sub, scale, ZERO } from "../src/numeric/complex";
import { complexLu, factor, solve, solveComplexLu, solveLu } from "../src/numeric/lu";

describe("complex", () => {
  it("basic identities", () => {
    expect(mul(C(1, 2), C(3, 4))).toEqual(C(-5, 10));
    expect(div(mul(C(1, 2), C(3, 4)), C(3, 4)).re).toBeCloseTo(1, 12);
    expect(abs(C(3, 4))).toBe(5);
    expect(conj(C(1, 2))).toEqual(C(1, -2));
    expect(arg(polar(2, 0.5))).toBeCloseTo(0.5, 12);
    expect(add(C(1, 1), sub(C(2, 2), C(1, 1)))).toEqual(C(2, 2));
    expect(scale(C(1, 2), 2)).toEqual(C(2, 4));
    expect(() => div(C(1), ZERO)).toThrow();
  });
});
describe("lu", () => {
  it("solves a known system", () => {
    const x = solve(
      [
        [2, 1],
        [1, 3],
      ],
      [3, 5],
    );
    expect(x[0]).toBeCloseTo(0.8, 12);
    expect(x[1]).toBeCloseTo(1.4, 12);
  });
  it("needs pivoting", () => {
    const x = solve(
      [
        [0, 1],
        [1, 0],
      ],
      [2, 3],
    );
    expect(x).toEqual([3, 2]);
  });
  it("rejects singular", () =>
    expect(() =>
      factor([
        [1, 2],
        [2, 4],
      ]),
    ).toThrow("numeric.singular"));
  it("random diagonally dominant systems satisfy A x = b within 1e-9", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 8 }),
        fc.array(fc.double({ min: -1, max: 1, noNaN: true }), { minLength: 80, maxLength: 80 }),
        (n, r) => {
          const A = Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) => r[i * 8 + j]! + (i === j ? n + 1 : 0)),
          );
          const b = Array.from({ length: n }, (_, i) => r[70 + (i % 10)]!);
          const x = solveLu(factor(A), b);
          for (let i = 0; i < n; i++)
            expect(Math.abs(A[i]!.reduce((s, v, j) => s + v * x[j]!, 0) - b[i]!)).toBeLessThan(1e-9);
        },
      ),
    );
  });
  it("solves a complex system", () => {
    const x = solveComplexLu(
      complexLu([
        [C(1, 1), C(0)],
        [C(0), C(2, -1)],
      ]),
      [C(2, 0), C(5, 0)],
    );
    expect(abs(sub(mul(C(1, 1), x[0]!), C(2)))).toBeLessThan(1e-12);
    expect(abs(sub(mul(C(2, -1), x[1]!), C(5)))).toBeLessThan(1e-12);
  });
});
