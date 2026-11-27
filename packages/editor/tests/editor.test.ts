import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { nets } from "@flow/model";
import { createEditor, makeContext, problemsOf, reduce, type Action, type EditorState } from "../src";

const ctx = makeContext(() => "2026-11-27T00:00:00Z");
const run = (s: EditorState, ...as: Action[]) => as.reduce((st, a) => reduce(st, a, ctx), s);
const term = (s: EditorState, device: string, role: string) => {
  const d = s.project.devices.find((x) => x.name === device)!;
  return s.project.terminals.find((t) => t.deviceId === d.id && t.role === role)!.id;
};

function feeder(): EditorState {
  let s = run(
    createEditor(),
    { type: "place", kind: "grid", x: 100, y: 40 },
    { type: "place", kind: "breaker", x: 100, y: 160 },
    { type: "place", kind: "load", x: 100, y: 280 },
  );
  s = run(
    s,
    { type: "connect", from: term(s, "G1", "out"), to: term(s, "Q1", "in") },
    { type: "connect", from: term(s, "Q1", "out"), to: term(s, "L1", "in") },
  );
  return s;
}

describe("first feeder", () => {
  it("a source, a breaker and a load connect and calculate without errors", () => {
    const s = feeder();
    expect(s.project.devices.map((d) => d.name)).toEqual(["G1", "Q1", "L1"]);
    expect(s.project.wires).toHaveLength(2);
    expect(s.results.loads).toHaveLength(1);
    expect(s.results.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(s.results.loads[0]!.voltage.value).toBeGreaterThan(390);
  });
  it("placement snaps to the grid", () => {
    const s = run(createEditor(), { type: "place", kind: "load", x: 113, y: 47 });
    expect(s.project.placements[0]).toMatchObject({ x: 120, y: 40 });
  });
});

describe("undo and redo", () => {
  it("undoing every step returns the empty project; redoing returns the final one (random, 100 runs)", () => {
    fc.assert(
      fc.property(fc.array(fc.nat(5), { minLength: 1, maxLength: 12 }), (picks) => {
        let s = createEditor();
        const start = s.project;
        for (const k of picks) {
          const devs = s.project.devices;
          const a: Action =
            k === 0 || devs.length < 2
              ? { type: "place", kind: k % 2 ? "load" : "grid", x: 20 * k, y: 20 * k }
              : k === 1
                ? { type: "connect", from: s.project.terminals[0]!.id, to: s.project.terminals.at(-1)!.id }
                : k === 2
                  ? { type: "delete", ids: [devs[0]!.id] }
                  : k === 3 && s.project.wires.length
                    ? { type: "delete", ids: [s.project.wires[0]!.id] }
                    : { type: "rename", deviceId: devs[0]!.id, name: `n${k}` };
          s = reduce(s, a, ctx);
        }
        const end = s.project;
        const steps = s.undo.length;
        for (let i = 0; i < steps; i++) s = reduce(s, { type: "undo" }, ctx);
        expect(s.project).toEqual(start);
        for (let i = 0; i < steps; i++) s = reduce(s, { type: "redo" }, ctx);
        expect(s.project).toEqual(end);
      }),
      { numRuns: 100 },
    );
  });
  it("a new edit clears redo; undo and redo with nothing to do change nothing", () => {
    let s = run(createEditor(), { type: "place", kind: "load", x: 0, y: 0 });
    s = run(s, { type: "undo" });
    expect(s.redo).toHaveLength(1);
    s = run(s, { type: "place", kind: "grid", x: 0, y: 0 });
    expect(s.redo).toHaveLength(0);
    const e = createEditor();
    expect(reduce(e, { type: "undo" }, ctx)).toBe(e);
    expect(reduce(e, { type: "redo" }, ctx)).toBe(e);
  });
});

describe("editing", () => {
  it("move, delete (wires first), rename, params, state, cable", () => {
    let s = feeder();
    const load = s.project.devices.find((d) => d.name === "L1")!;
    s = run(s, { type: "move", ids: [load.id], dx: 40, dy: 0 });
    expect(s.project.placements.find((p) => p.entityId === load.id)!.x).toBe(140);
    s = run(s, { type: "rename", deviceId: load.id, name: "Pump" });
    expect(s.project.devices.find((d) => d.id === load.id)!.name).toBe("Pump");
    s = run(s, { type: "param", deviceId: load.id, field: "power", value: { v: 5000, u: "W" } });
    expect(s.results.loads[0]!.activePower.value).toBe(5000);
    const br = s.project.devices.find((d) => d.name === "Q1")!;
    s = run(s, { type: "state", deviceId: br.id, state: "open" });
    expect(s.results.loads).toHaveLength(0);
    s = run(s, { type: "state", deviceId: br.id, state: "closed" });
    const cableId = s.project.cables[1]!.id;
    s = run(s, {
      type: "cable",
      cableId,
      change: { lengthM: 25, installation: "C", sectionMm2: 16, material: "Cu", insulation: "XLPE" },
    });
    expect(s.project.cables[1]).toMatchObject({ lengthM: 25 });
    expect(s.project.cables[1]!.conductors[0]).toMatchObject({ sectionMm2: 16, insulation: "XLPE" });
    s = run(s, { type: "delete", ids: [s.project.wires[0]!.id, br.id] });
    expect(s.project.devices.map((d) => d.name)).toEqual(["G1", "Pump"]);
    expect(s.project.wires).toHaveLength(0);
  });
  it("a rejected edit keeps the project and reports the code", () => {
    const s = feeder();
    const d = s.project.devices[0]!;
    const r = run(s, { type: "param", deviceId: d.id, field: "voltage", value: "not a number" });
    expect(r.project).toBe(s.project);
    expect(r.rejected).toBe("model.device.param_invalid");
    const ok = run(r, { type: "rename", deviceId: d.id, name: "A" });
    expect(ok.rejected).toBeUndefined();
  });
  it("a wire from a terminal to itself is ignored", () => {
    const s = feeder();
    const t = s.project.terminals[0]!.id;
    expect(run(s, { type: "connect", from: t, to: t })).toBe(s);
  });
  it("tools, selection, cancel and wire expansion", () => {
    let s = run(
      createEditor(),
      { type: "tool", tool: { type: "place", kind: "load" } },
      { type: "select", ids: ["a"] },
    );
    expect(s.tool).toEqual({ type: "place", kind: "load" });
    s = run(s, { type: "cancel" });
    expect(s.tool).toEqual({ type: "select" });
    expect(s.selection).toEqual([]);
    s = run(s, { type: "expand", wireId: "w" });
    expect(s.expanded).toEqual(["w"]);
    s = run(s, { type: "expand", wireId: "w" });
    expect(s.expanded).toEqual([]);
  });
});

describe("busbar advice and fix", () => {
  function star(): EditorState {
    let s = run(createEditor(), { type: "place", kind: "grid", x: 100, y: 40 });
    for (let i = 0; i < 3; i++) s = run(s, { type: "place", kind: "load", x: 20 + i * 100, y: 240 });
    const g = term(s, "G1", "out");
    for (let i = 1; i <= 3; i++) s = run(s, { type: "connect", from: g, to: term(s, `L${i}`, "in") });
    return s;
  }
  it("suggests a busbar at three wires and the one-click fix removes the suggestion without changing connectivity", () => {
    const s = star();
    const p = problemsOf(s.results).find((x) => x.fix);
    expect(p?.fix?.type).toBe("busbar");
    const before = nets(s.project).filter((n) => n.length > 1).length;
    const fixed = run(s, { type: "fix", terminalId: p!.fix!.terminalId });
    expect(problemsOf(fixed.results).some((x) => x.fix)).toBe(false);
    expect(fixed.project.devices.some((d) => d.kind === "busbar")).toBe(true);
    expect(nets(fixed.project).filter((n) => n.length > 1).length).toBeLessThanOrEqual(before + 1);
    expect(fixed.results.loads).toHaveLength(3);
    const undone = run(fixed, { type: "undo" });
    expect(undone.project).toEqual(s.project);
  });
  it("the fix does nothing for a terminal with fewer than two wires", () => {
    const s = feeder();
    expect(run(s, { type: "fix", terminalId: term(s, "L1", "in") })).toBe(s);
  });
});

describe("problems", () => {
  it("lists errors before warnings before info", () => {
    const s = run(createEditor(), { type: "place", kind: "load", x: 0, y: 0 });
    const r = problemsOf(s.results);
    const ranks = r.map((p) => ({ error: 0, warning: 1, info: 2 })[p.diagnostic.severity]);
    expect(ranks).toEqual([...ranks].sort());
  });
});

describe("keyboard shortcuts", () => {
  it("maps keys to actions and ignores most keys while typing", async () => {
    const { keyToAction } = await import("../src");
    const k = (key: string, o: Partial<{ ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }> = {}) => ({
      key,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      ...o,
    });
    expect(keyToAction(k("Escape"), true, [])).toEqual({ type: "cancel" });
    expect(keyToAction(k("Delete"), false, ["a"])).toEqual({ type: "delete", ids: ["a"] });
    expect(keyToAction(k("Delete"), true, ["a"])).toBeUndefined();
    expect(keyToAction(k("Delete"), false, [])).toBeUndefined();
    expect(keyToAction(k("z", { ctrlKey: true }), false, [])).toEqual({ type: "undo" });
    expect(keyToAction(k("Z", { metaKey: true, shiftKey: true }), false, [])).toEqual({ type: "redo" });
    expect(keyToAction(k("y", { ctrlKey: true }), false, [])).toEqual({ type: "redo" });
    expect(keyToAction(k("q"), false, [])).toBeUndefined();
  });
});

describe("edge cases", () => {
  it("placing an unknown kind is rejected and keeps the state", () => {
    const s = createEditor();
    const r = run(s, { type: "place", kind: "zzz", x: 0, y: 0 });
    expect(r.project).toBe(s.project);
    expect(r.rejected).toBe("model.device.kind_unknown");
  });
  it("the default context makes ids and times", () => {
    const c = makeContext();
    expect(c.newId()).toHaveLength(26);
    expect(c.now()).toMatch(/^\d{4}-/);
  });
  it("connecting to a missing terminal is rejected", () => {
    const s = feeder();
    const r = run(s, { type: "connect", from: s.project.terminals[0]!.id, to: "x".repeat(26) });
    expect(r.rejected).toBe("model.wire.endpoint_missing");
  });
  it("default conductors follow the power system of the terminal", async () => {
    const { systemOf } = await import("../src");
    let s = run(
      createEditor(),
      { type: "place", kind: "rectifier", x: 0, y: 0 },
      { type: "place", kind: "grid", x: 0, y: 100 },
    );
    const rect = (role: string) =>
      s.project.terminals.find(
        (t) => t.role === role && s.project.devices.find((d) => d.id === t.deviceId)!.kind === "rectifier",
      )!.id;
    expect(systemOf(s.project, rect("out"))).toBe("dc");
    expect(systemOf(s.project, rect("in"))).toBe("ac3");
    s = run(s, { type: "param", deviceId: s.project.devices[1]!.id, field: "system", value: "ac1" });
    expect(systemOf(s.project, s.project.terminals.find((t) => t.deviceId === s.project.devices[1]!.id)!.id)).toBe(
      "ac1",
    );
    expect(systemOf(s.project, "nope")).toBe("ac3");
  });
  it("a redo that no longer applies is dropped with a reason", () => {
    let s = run(createEditor(), { type: "place", kind: "load", x: 0, y: 0 });
    s = run(s, { type: "undo" });
    const broken = {
      ...s,
      redo: [{ ...s.redo[0]!, commands: [{ ...s.redo[0]!.commands[0]!, type: "nope" as never }] }],
    };
    const r = run(broken, { type: "redo" });
    expect(r.redo).toEqual([]);
    expect(r.rejected).toBe("model.command.unknown");
  });
  it("a batch of edits that fails midway leaves nothing behind", () => {
    const s = feeder();
    const load = s.project.devices.find((d) => d.name === "L1")!;
    const r = run(s, { type: "delete", ids: [load.id, load.id] });
    expect(r.project).toBe(s.project);
    expect(r.rejected).toBe("model.device.not_found");
  });
});

describe("notes, zones, layers and settings", () => {
  it("adds, edits, moves and deletes every kind of note, with undo", () => {
    let s = createEditor();
    for (const shape of ["text", "rect", "ellipse", "arrow", "zone"] as const)
      s = run(s, { type: "annotate", shape, x: 33, y: 47 });
    expect(s.project.annotations.map((a) => a.type)).toEqual(["text", "rect", "ellipse", "arrow", "rect"]);
    expect(s.project.annotations[4]).toMatchObject({ style: { zone: "1" }, text: "Z1" });
    expect(s.project.annotations[0]!.placement).toMatchObject({ x: 40, y: 40 });
    const id = s.project.annotations[1]!.id;
    s = run(s, { type: "move", ids: [id], dx: 40, dy: 20 });
    expect(s.project.annotations[1]!.placement).toMatchObject({ x: 80, y: 60 });
    s = run(s, { type: "annotation", annotation: { ...s.project.annotations[0]!, text: "Main" } });
    expect(s.project.annotations[0]!.text).toBe("Main");
    s = run(s, { type: "delete", ids: [id] });
    expect(s.project.annotations).toHaveLength(4);
    s = run(s, { type: "undo" });
    expect(s.project.annotations).toHaveLength(5);
  });
  it("hides layers and keeps settings out of the undo history", () => {
    let s = run(createEditor(), { type: "layer", layer: "wire" });
    expect(s.hidden).toEqual(["wire"]);
    s = run(s, { type: "layer", layer: "wire" });
    expect(s.hidden).toEqual([]);
    s = run(s, { type: "settings", patch: { cableLengthM: 25, cableSectionMm2: 16 } });
    expect(s.settings).toMatchObject({ cableLengthM: 25, cableSectionMm2: 16, showGrid: true });
    expect(s.undo).toHaveLength(0);
  });
  it("new cables use the settings", () => {
    let s = feeder();
    s = run(s, { type: "settings", patch: { cableLengthM: 42, cableSectionMm2: 35 } });
    s = run(s, { type: "place", kind: "load", x: 300, y: 280 });
    s = run(s, { type: "connect", from: term(s, "Q1", "out"), to: term(s, "L2", "in") });
    const cable = s.project.cables.at(-1)!;
    expect(cable.lengthM).toBe(42);
    expect(cable.conductors[0]!.sectionMm2).toBe(35);
  });
});
