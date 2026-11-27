import { C, abs, add, conj, div, mul, sub, type Complex } from "../numeric/complex";
import { factor, solveLu } from "../numeric/lu";

/** Per-unit network. Node injections `s` are specified power into the node (loads are negative). */
export interface PfNode {
  slack: boolean;
  vSet: number;
  s: Complex;
}
export interface PfBranch {
  from: number;
  to: number;
  z: Complex;
}
export interface PfResult {
  v: Complex[];
  iterations: number;
  converged: boolean;
  method: "sweep" | "newton";
}

const TOL = 1e-8;

export function isRadial(n: number, branches: PfBranch[], nodes: PfNode[]): boolean {
  if (nodes.filter((x) => x.slack).length !== 1 || branches.length !== n - 1) return false;
  const seen = new Set<number>([nodes.findIndex((x) => x.slack)]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const b of branches)
      if (seen.has(b.from) !== seen.has(b.to)) {
        seen.add(b.from);
        seen.add(b.to);
        grew = true;
      }
  }
  return seen.size === n;
}

/** Backward/forward sweep for a tree with one slack node. */
export function sweep(nodes: PfNode[], branches: PfBranch[], maxIter = 100): PfResult {
  const n = nodes.length;
  const root = nodes.findIndex((x) => x.slack);
  const adj: Array<Array<{ to: number; z: Complex }>> = Array.from({ length: n }, () => []);
  for (const b of branches) {
    adj[b.from]!.push({ to: b.to, z: b.z });
    adj[b.to]!.push({ to: b.from, z: b.z });
  }
  const order: number[] = [root];
  const parent = new Array<number>(n).fill(-1);
  const pz: Complex[] = new Array(n).fill(C(0));
  for (let k = 0; k < order.length; k++)
    for (const e of adj[order[k]!]!)
      if (e.to !== root && parent[e.to] === -1 && !order.includes(e.to)) {
        parent[e.to] = order[k]!;
        pz[e.to] = e.z;
        order.push(e.to);
      }
  const v: Complex[] = nodes.map((x) => C(x.vSet));
  for (let it = 1; it <= maxIter; it++) {
    const cur: Complex[] = nodes.map((x, i) => (x.slack ? C(0) : conj(div(C(-x.s.re, -x.s.im), v[i]!))));
    for (let k = order.length - 1; k > 0; k--) {
      const i = order[k]!;
      cur[parent[i]!] = add(cur[parent[i]!]!, cur[i]!);
    }
    let dv = 0;
    for (let k = 1; k < order.length; k++) {
      const i = order[k]!;
      const nv = sub(v[parent[i]!]!, mul(pz[i]!, cur[i]!));
      dv = Math.max(dv, abs(sub(nv, v[i]!)));
      v[i] = nv;
    }
    if (dv < TOL) return { v, iterations: it, converged: true, method: "sweep" };
  }
  return { v, iterations: maxIter, converged: false, method: "sweep" };
}

/** Newton-Raphson in rectangular coordinates, flat start, analytic Jacobian, dense LU. */
export function newton(nodes: PfNode[], branches: PfBranch[], maxIter = 30): PfResult {
  const n = nodes.length;
  const G = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const B = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (const br of branches) {
    const y = div(C(1), br.z);
    const { from: i, to: j } = br;
    G[i]![i]! += y.re;
    B[i]![i]! += y.im;
    G[j]![j]! += y.re;
    B[j]![j]! += y.im;
    G[i]![j]! -= y.re;
    B[i]![j]! -= y.im;
    G[j]![i]! -= y.re;
    B[j]![i]! -= y.im;
  }
  const free = nodes.map((x, i) => (x.slack ? -1 : i)).filter((i) => i >= 0);
  const m = free.length;
  const e = nodes.map((x) => x.vSet);
  const f = nodes.map(() => 0);
  for (let it = 1; it <= maxIter; it++) {
    const a = new Array<number>(n).fill(0);
    const b = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (G[i]![j] === 0 && B[i]![j] === 0) continue;
        a[i]! += G[i]![j]! * e[j]! - B[i]![j]! * f[j]!;
        b[i]! += B[i]![j]! * e[j]! + G[i]![j]! * f[j]!;
      }
    const mis = new Array<number>(2 * m);
    let worst = 0;
    free.forEach((i, r) => {
      const p = e[i]! * a[i]! + f[i]! * b[i]!;
      const q = f[i]! * a[i]! - e[i]! * b[i]!;
      mis[r] = nodes[i]!.s.re - p;
      mis[r + m] = nodes[i]!.s.im - q;
      worst = Math.max(worst, Math.abs(mis[r]!), Math.abs(mis[r + m]!));
    });
    if (worst < TOL)
      return { v: nodes.map((_, i) => C(e[i]!, f[i]!)), iterations: it - 1, converged: true, method: "newton" };
    const J = Array.from({ length: 2 * m }, () => new Array<number>(2 * m).fill(0));
    free.forEach((i, r) =>
      free.forEach((j, c) => {
        const g = G[i]![j]!,
          bb = B[i]![j]!;
        let dPe = e[i]! * g + f[i]! * bb,
          dPf = -e[i]! * bb + f[i]! * g;
        let dQe = f[i]! * g - e[i]! * bb,
          dQf = -f[i]! * bb - e[i]! * g;
        if (i === j) {
          dPe += a[i]!;
          dPf += b[i]!;
          dQe -= b[i]!;
          dQf += a[i]!;
        }
        J[r]![c] = dPe;
        J[r]![c + m] = dPf;
        J[r + m]![c] = dQe;
        J[r + m]![c + m] = dQf;
      }),
    );
    const dx = solveLu(factor(J), mis);
    free.forEach((i, r) => {
      e[i]! += dx[r]!;
      f[i]! += dx[r + m]!;
    });
  }
  return { v: nodes.map((_, i) => C(e[i]!, f[i]!)), iterations: maxIter, converged: false, method: "newton" };
}

export function solvePowerFlow(nodes: PfNode[], branches: PfBranch[]): PfResult {
  return isRadial(nodes.length, branches, nodes) ? sweep(nodes, branches) : newton(nodes, branches);
}
