import { describe, expect, it } from "vitest";
import { applyCommand, applyInverse, type Change, type Command } from "../src";
import { base, cmd, ctx, cu, fc } from "./helpers";

describe("undo", () => {
  it("undoing any random command sequence returns to the start (200 runs)", () => {
    fc.assert(fc.property(fc.array(fc.nat(6), { minLength: 1, maxLength: 25 }), (picks) => {
      let p = base();
      const stack: Change[][] = [];
      for (const k of picks) {
        let c: Command;
        const d = p.devices;
        const t = p.terminals;
        if (k === 0 || d.length < 2) c = cmd("device.add", { kind: k % 2 ? "load" : "grid", name: "n", params: {} });
        else if (k === 1 && t.length >= 2) c = cmd("wire.add", { cable: { lengthM: 1, installation: "A", conductors: [cu] }, from: { terminalId: t[0]!.id }, to: { terminalId: t[t.length - 1]!.id } });
        else if (k === 2 && p.wires.length) c = cmd("wire.remove", { wireId: p.wires[0]!.id });
        else if (k === 3) c = cmd("device.remove", { deviceId: d[0]!.id });
        else if (k === 4 && p.wires.length) c = cmd("junction.promote", { terminalId: t[0]!.id });
        else c = cmd("project.rename", { name: "r" + k });
        const r = applyCommand(p, c, ctx);
        if (r.ok) { p = r.project; stack.push(r.inverse); }
      }
      while (stack.length) p = applyInverse(p, stack.pop()!);
      expect(p).toEqual(base());
    }), { numRuns: 200 });
  });
});
