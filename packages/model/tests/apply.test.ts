import { describe, expect, it } from "vitest";
import { applyCommand, applyInverse, CODES, type Command, type Project } from "../src";
import { base, cmd, ctx, cu } from "./helpers";

function run(p: Project, c: Command): Project {
  const r = applyCommand(p, c, ctx);
  if (!r.ok) throw new Error(r.diagnostic.code);
  return r.project;
}
function rej(p: Project, c: Command): string {
  const r = applyCommand(p, c, ctx);
  return r.ok ? "ok" : r.diagnostic.code;
}
function twoDevices() {
  let p = base();
  p = run(p, cmd("device.add", { kind: "grid", name: "G", params: {} }));
  p = run(p, cmd("device.add", { kind: "load", name: "L", params: {} }));
  return p;
}
const wireCmd = (p: Project) =>
  cmd("wire.add", {
    cable: { lengthM: 10, installation: "A", conductors: [cu] },
    from: { terminalId: p.terminals[0]!.id },
    to: { terminalId: p.terminals[1]!.id },
  });

describe("commands", () => {
  it("project.rename and its rejection", () => {
    expect(run(base(), cmd("project.rename", { name: "X" })).name).toBe("X");
    expect(rej(base(), cmd("project.rename", { name: " " }))).toBe(CODES.projectNameEmpty);
  });
  it("device.add creates terminals, rejects unknown kind and bad param", () => {
    const p = twoDevices();
    expect(p.devices).toHaveLength(2);
    expect(p.terminals).toHaveLength(2);
    expect(rej(base(), cmd("device.add", { kind: "zzz", name: "", params: {} }))).toBe(CODES.deviceKindUnknown);
    expect(rej(base(), cmd("device.add", { kind: "load", name: "", params: { bad: 1 } }))).toBe(
      CODES.deviceParamInvalid,
    );
  });
  it("device.rename and its rejection", () => {
    const p = twoDevices();
    expect(run(p, cmd("device.rename", { deviceId: p.devices[0]!.id, name: "Main" })).devices[0]!.name).toBe("Main");
    expect(rej(p, cmd("device.rename", { deviceId: "x".repeat(26), name: "n" }))).toBe(CODES.deviceNotFound);
  });
  it("device.setParam, setState and rejections", () => {
    const p = twoDevices();
    const id = p.devices[0]!.id;
    expect(run(p, cmd("device.setParam", { deviceId: id, field: "p", value: 5 })).devices[0]!.params["p"]).toBe(5);
    expect(rej(p, cmd("device.setParam", { deviceId: id, field: "bad", value: 5 }))).toBe(CODES.deviceParamInvalid);
    expect(run(p, cmd("device.setState", { deviceId: id, state: "open" })).devices[0]!.state).toBe("open");
    expect(rej(p, cmd("device.setState", { deviceId: id, state: "grounded" }))).toBe(CODES.deviceStateInvalid);
    expect(rej(p, cmd("device.setState", { deviceId: "x".repeat(26), state: "open" }))).toBe(CODES.deviceNotFound);
  });
  it("wire.add / wire.remove / rejections", () => {
    const p = twoDevices();
    const w = run(p, wireCmd(p));
    expect(w.wires).toHaveLength(1);
    expect(w.cables).toHaveLength(1);
    expect(
      rej(
        p,
        cmd("wire.add", {
          cable: { lengthM: 1, installation: "A", conductors: [cu] },
          from: { terminalId: "q".repeat(26) },
          to: { terminalId: p.terminals[0]!.id },
        }),
      ),
    ).toBe(CODES.wireEndpointMissing);
    const gone = run(w, cmd("wire.remove", { wireId: w.wires[0]!.id }));
    expect(gone.wires).toHaveLength(0);
    expect(gone.cables).toHaveLength(0);
    expect(rej(p, cmd("wire.remove", { wireId: "x".repeat(26) }))).toBe(CODES.wireNotFound);
  });
  it("wire.add rejects a conductor the terminal does not allow", () => {
    const p = twoDevices();
    const t = { ...p, terminals: p.terminals.map((x) => ({ ...x, conductors: ["L1"] })) };
    expect(rej(t, wireCmd(t))).toBe(CODES.wireConductorMismatch);
  });
  it("cable.setConductor and rejections", () => {
    const p = twoDevices();
    const w = run(p, wireCmd(p));
    const cid = w.cables[0]!.id;
    expect(
      run(w, cmd("cable.setConductor", { cableId: cid, role: "L", field: "sectionMm2", value: 4 })).cables[0]!
        .conductors[0]!.sectionMm2,
    ).toBe(4);
    expect(rej(w, cmd("cable.setConductor", { cableId: cid, role: "L", field: "sectionMm2", value: -1 }))).toBe(
      CODES.cableConductorInvalid,
    );
    expect(rej(w, cmd("cable.setConductor", { cableId: cid, role: "N", field: "material", value: "Cu" }))).toBe(
      CODES.cableConductorInvalid,
    );
    expect(
      rej(w, cmd("cable.setConductor", { cableId: "x".repeat(26), role: "L", field: "material", value: "Cu" })),
    ).toBe(CODES.cableNotFound);
  });
  it("cable.set length and installation, with rejections", () => {
    const p = twoDevices();
    const w = run(p, wireCmd(p));
    const cid = w.cables[0]!.id;
    expect(run(w, cmd("cable.set", { cableId: cid, field: "lengthM", value: 55 })).cables[0]!.lengthM).toBe(55);
    expect(run(w, cmd("cable.set", { cableId: cid, field: "installation", value: "E" })).cables[0]!.installation).toBe(
      "E",
    );
    expect(rej(w, cmd("cable.set", { cableId: cid, field: "lengthM", value: -1 }))).toBe(CODES.cableConductorInvalid);
    expect(rej(w, cmd("cable.set", { cableId: cid, field: "installation", value: "" }))).toBe(
      CODES.cableConductorInvalid,
    );
    expect(rej(w, cmd("cable.set", { cableId: "x".repeat(26), field: "lengthM", value: 1 }))).toBe(CODES.cableNotFound);
  });
  it("device.remove removes its wires; inverse restores exactly", () => {
    const p = twoDevices();
    const w = run(p, wireCmd(p));
    const r = applyCommand(w, cmd("device.remove", { deviceId: w.devices[0]!.id }), ctx);
    if (!r.ok) throw new Error();
    expect(r.project.wires).toHaveLength(0);
    expect(applyInverse(r.project, r.inverse)).toEqual(w);
    expect(rej(w, cmd("device.remove", { deviceId: "x".repeat(26) }))).toBe(CODES.deviceNotFound);
  });
  it("circuits, placement, annotation", () => {
    const p = twoDevices();
    const d = p.devices[0]!.id;
    const c = run(p, cmd("circuit.create", { circuit: { members: [d], overrides: {} } }));
    const cid = c.circuits[0]!.id;
    expect(run(c, cmd("circuit.setMembers", { circuitId: cid, members: [] })).circuits[0]!.members).toEqual([]);
    expect(rej(p, cmd("circuit.create", { circuit: { members: ["m".repeat(26)], overrides: {} } }))).toBe(
      CODES.circuitMemberMissing,
    );
    expect(rej(c, cmd("circuit.setMembers", { circuitId: "x".repeat(26), members: [] }))).toBe(CODES.circuitNotFound);
    expect(run(c, cmd("circuit.remove", { circuitId: cid })).circuits).toHaveLength(0);
    const pl = run(p, cmd("placement.set", { placement: { viewId: "v", entityId: d, x: 1, y: 2, rotation: 0 } }));
    expect(pl.placements).toHaveLength(1);
    expect(
      run(
        pl,
        cmd("placement.set", {
          placement: { id: pl.placements[0]!.id, viewId: "v", entityId: d, x: 9, y: 2, rotation: 0 },
        }),
      ).placements[0]!.x,
    ).toBe(9);
    expect(
      rej(p, cmd("placement.set", { placement: { viewId: "v", entityId: "z".repeat(26), x: 0, y: 0, rotation: 0 } })),
    ).toBe(CODES.placementEntityMissing);
    const a = run(
      p,
      cmd("annotation.add", {
        annotation: { type: "text", placement: { viewId: "v", x: 0, y: 0, rotation: 0 }, style: {}, text: "hi" },
      }),
    );
    const an = a.annotations[0]!;
    expect(run(a, cmd("annotation.set", { annotation: { ...an, text: "yo" } })).annotations[0]!.text).toBe("yo");
    expect(run(a, cmd("annotation.remove", { annotationId: an.id })).annotations).toHaveLength(0);
    expect(rej(p, cmd("annotation.remove", { annotationId: "x".repeat(26) }))).toBe(CODES.annotationNotFound);
    expect(rej(p, cmd("annotation.set", { annotation: { ...an, id: "y".repeat(26) } }))).toBe(CODES.annotationNotFound);
  });
  it("every command's inverse restores the previous model exactly", () => {
    const p = twoDevices();
    for (const c of [
      wireCmd(p),
      cmd("project.rename", { name: "Z" }),
      cmd("device.setState", { deviceId: p.devices[0]!.id, state: "open" }),
    ]) {
      const r = applyCommand(p, c, ctx);
      if (!r.ok) throw new Error();
      expect(applyInverse(r.project, r.inverse)).toEqual(p);
    }
  });
  it("unknown command is rejected", () => {
    expect(rej(base(), { id: "1", type: "nope" as never, v: 1, at: "", by: "", payload: {} as never })).toBe(
      CODES.commandUnknown,
    );
  });
});
