import { describe, expect, it } from "vitest";
import { C, abs, conj, div, mul, sub } from "../src/numeric/complex";
import { isRadial, newton, solvePowerFlow, sweep, type PfBranch, type PfNode } from "../src/solvers/powerflow";

const slack: PfNode = { slack: true, vSet: 1, s: C(0) };
const load = (p: number, q = 0): PfNode => ({ slack: false, vSet: 1, s: C(-p, -q) });

describe("power flow", () => {
  it("single branch matches the closed-form solution", () => {
    const nodes = [slack, load(0.1)];
    const br: PfBranch[] = [{ from: 0, to: 1, z: C(0.02, 0.01) }];
    const r = sweep(nodes, br);
    expect(r.converged).toBe(true);
    const z = C(0.02, 0.01);
    const i = div(sub(C(1), r.v[1]!), z); // current into node 1
    expect(abs(sub(mul(r.v[1]!, conj(i)), C(0.1, 0)))).toBeLessThan(1e-9);
  });
  it("sweep and Newton agree on a radial network", () => {
    const nodes = [slack, load(0.05, 0.02), load(0.08, 0.03), load(0.02)];
    const br: PfBranch[] = [{ from: 0, to: 1, z: C(0.01, 0.005) }, { from: 1, to: 2, z: C(0.02, 0.01) }, { from: 1, to: 3, z: C(0.03, 0.01) }];
    expect(isRadial(4, br, nodes)).toBe(true);
    const a = sweep(nodes, br);
    const b = newton(nodes, br);
    expect(a.converged && b.converged).toBe(true);
    a.v.forEach((v, i) => expect(abs(sub(v, b.v[i]!))).toBeLessThan(1e-7));
  });
  it("solves a meshed network and conserves power", () => {
    const nodes = [slack, load(0.04), load(0.06, 0.02), load(0.03)];
    const br: PfBranch[] = [{ from: 0, to: 1, z: C(0.01, 0.01) }, { from: 1, to: 2, z: C(0.02, 0.01) }, { from: 2, to: 3, z: C(0.02, 0.01) }, { from: 3, to: 0, z: C(0.015, 0.01) }];
    expect(isRadial(4, br, nodes)).toBe(false);
    const r = solvePowerFlow(nodes, br);
    expect(r.method).toBe("newton");
    expect(r.converged).toBe(true);
    let loss = 0;
    for (const b of br) { const dv = sub(r.v[b.from]!, r.v[b.to]!); const i = mul(dv, { re: b.z.re / (b.z.re ** 2 + b.z.im ** 2), im: -b.z.im / (b.z.re ** 2 + b.z.im ** 2) }); loss += (abs(i) ** 2) * b.z.re; }
    let slackP = 0;
    for (const b of br) if (b.from === 0 || b.to === 0) { const o = b.from === 0 ? b.to : b.from; const dv = sub(r.v[0]!, r.v[o]!); const y = { re: b.z.re / (b.z.re ** 2 + b.z.im ** 2), im: -b.z.im / (b.z.re ** 2 + b.z.im ** 2) }; slackP += mul(r.v[0]!, conj(mul(dv, y))).re; }
    expect(slackP).toBeCloseTo(0.13 + loss, 8);
  });
  it("reports non-convergence for an impossible load", () => {
    const r = newton([slack, load(50)], [{ from: 0, to: 1, z: C(0.1, 0.1) }]);
    expect(r.converged).toBe(false);
  });
  it("single slack with a non-tree is not radial; no slack is not radial", () => {
    expect(isRadial(2, [], [slack, load(1)])).toBe(false);
    expect(isRadial(2, [{ from: 0, to: 1, z: C(1) }], [load(1), load(1)])).toBe(false);
  });
});
