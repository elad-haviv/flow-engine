import { C, type Complex } from "./complex";

/** Dense LU factorisation with partial pivoting. Rows are copied; the input is not changed. */
export interface Lu { n: number; a: number[][]; perm: number[] }

export function factor(m: number[][]): Lu {
  const n = m.length;
  const a = m.map((r) => r.slice());
  const perm = Array.from({ length: n }, (_, i) => i);
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(a[i]![k]!) > Math.abs(a[p]![k]!)) p = i;
    if (Math.abs(a[p]![k]!) < 1e-300) throw new Error("numeric.singular");
    if (p !== k) { [a[p], a[k]] = [a[k]!, a[p]!]; [perm[p], perm[k]] = [perm[k]!, perm[p]!]; }
    const rk = a[k]!;
    for (let i = k + 1; i < n; i++) {
      const ri = a[i]!;
      const f = ri[k]! / rk[k]!;
      ri[k] = f;
      if (f !== 0) for (let j = k + 1; j < n; j++) ri[j]! -= f * rk[j]!;
    }
  }
  return { n, a, perm };
}

export function solveLu(lu: Lu, b: number[]): number[] {
  const { n, a, perm } = lu;
  const x = perm.map((p) => b[p]!);
  for (let i = 0; i < n; i++) { const r = a[i]!; let s = x[i]!; for (let j = 0; j < i; j++) s -= r[j]! * x[j]!; x[i] = s; }
  for (let i = n - 1; i >= 0; i--) { const r = a[i]!; let s = x[i]!; for (let j = i + 1; j < n; j++) s -= r[j]! * x[j]!; x[i] = s / r[i]!; }
  return x;
}

export const solve = (m: number[][], b: number[]): number[] => solveLu(factor(m), b);

/** Complex system through the real 2n x 2n embedding [[A,-B],[B,A]]. */
export function complexLu(m: Complex[][]): Lu {
  const n = m.length;
  const big = Array.from({ length: 2 * n }, () => new Array<number>(2 * n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const z = m[i]![j]!;
    big[i]![j] = z.re; big[i]![j + n] = -z.im; big[i + n]![j] = z.im; big[i + n]![j + n] = z.re;
  }
  return factor(big);
}

export function solveComplexLu(lu: Lu, b: Complex[]): Complex[] {
  const n = lu.n / 2;
  const x = solveLu(lu, [...b.map((z) => z.re), ...b.map((z) => z.im)]);
  return Array.from({ length: n }, (_, i) => C(x[i]!, x[i + n]!));
}
