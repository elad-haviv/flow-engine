import { describe, expect, it } from "vitest";
import { applyCommand, CODES, nets, type Project } from "../src";
import { base, cmd, ctx, cu } from "./helpers";

const step = (p: Project, c: ReturnType<typeof cmd>): Project => {
  const r = applyCommand(p, c, ctx);
  if (!r.ok) throw new Error(r.diagnostic.code);
  return r.project;
};

function star(n: number): { p: Project; hub: string } {
  let p = step(base(), cmd("device.add", { kind: "bus", name: "hub", params: {} }));
  const hub = p.terminals[0]!.id;
  for (let i = 0; i < n; i++) {
    p = step(p, cmd("device.add", { kind: "load", name: `l${i}`, params: {} }));
    p = step(
      p,
      cmd("wire.add", {
        cable: { lengthM: 1, installation: "A", conductors: [cu] },
        from: { terminalId: hub },
        to: { terminalId: p.terminals[i + 1]!.id },
      }),
    );
  }
  return { p, hub };
}

describe("junction promote/demote", () => {
  for (const n of [1, 2, 3, 4, 5]) {
    it(`keeps connectivity identical with ${n} wires`, () => {
      const { p, hub } = star(n);
      const before = nets(p);
      const promoted = step(p, cmd("junction.promote", { terminalId: hub, name: "J" }));
      expect(promoted.junctions).toHaveLength(1);
      expect(nets(promoted)).toEqual(before);
      const j = step(p, cmd("junction.promote", { terminalId: hub }));
      const demoted = step(j, cmd("junction.demote", { junctionId: j.junctions[0]!.id }));
      expect(nets(demoted)).toEqual(before);
      expect(demoted).toEqual(p);
    });
  }
  it("rejections", () => {
    const { p, hub } = star(1);
    const rej = (c: ReturnType<typeof cmd>) => {
      const r = applyCommand(p, c, ctx);
      return r.ok ? "ok" : r.diagnostic.code;
    };
    expect(rej(cmd("junction.promote", { terminalId: "q".repeat(26) }))).toBe(CODES.junctionNotApplicable);
    const lone = step(p, cmd("device.add", { kind: "load", name: "x", params: {} }));
    expect(applyCommand(lone, cmd("junction.promote", { terminalId: lone.terminals.at(-1)!.id }), ctx).ok).toBe(false);
    const j = step(p, cmd("junction.promote", { terminalId: hub, ratingA: 63 }));
    const r = applyCommand(j, cmd("junction.demote", { junctionId: j.junctions[0]!.id }), ctx);
    expect(!r.ok && r.diagnostic.code).toBe(CODES.junctionHasData);
    expect(applyCommand(j, cmd("junction.promote", { terminalId: hub }), ctx).ok).toBe(false);
    expect(rej(cmd("junction.demote", { junctionId: "x".repeat(26) }))).toBe(CODES.junctionNotApplicable);
  });
});
