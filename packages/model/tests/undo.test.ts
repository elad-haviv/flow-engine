import { describe, expect, it } from "vitest";
import { applyCommand, applyInverse, type Change, type Command, type Project } from "../src";
import { base, cmd, ctx, cu, fc } from "./helpers";

function pick(k: number, p: Project): Command {
  const d = p.devices;
  const t = p.terminals;
  const wire = () =>
    cmd("wire.add", {
      cable: { lengthM: 1, installation: "A", conductors: [cu] },
      from: { terminalId: t[0]!.id },
      to: { terminalId: t[t.length - 1]!.id },
    });
  const options: Array<[boolean, () => Command]> = [
    [k === 0 || d.length < 2, () => cmd("device.add", { kind: k % 2 ? "load" : "grid", name: "n", params: {} })],
    [k === 1 && t.length >= 2, wire],
    [k === 2 && p.wires.length > 0, () => cmd("wire.remove", { wireId: p.wires[0]!.id })],
    [k === 3, () => cmd("device.remove", { deviceId: d[0]!.id })],
    [k === 4 && p.wires.length > 0, () => cmd("junction.promote", { terminalId: t[0]!.id })],
  ];
  return (options.find(([on]) => on)?.[1] ?? (() => cmd("project.rename", { name: "r" + k })))();
}

describe("undo", () => {
  it("undoing any random command sequence returns to the start (200 runs)", () => {
    fc.assert(
      fc.property(fc.array(fc.nat(6), { minLength: 1, maxLength: 25 }), (picks) => {
        let p = base();
        const stack: Change[][] = [];
        for (const k of picks) {
          const c = pick(k, p);
          const r = applyCommand(p, c, ctx);
          if (r.ok) {
            p = r.project;
            stack.push(r.inverse);
          }
        }
        while (stack.length) p = applyInverse(p, stack.pop()!);
        expect(p).toEqual(base());
      }),
      { numRuns: 200 },
    );
  });
});
