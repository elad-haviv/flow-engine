import { describe, expect, it } from "vitest";
import { buildScene, createEditor, makeContext, reduce, visibleIn, type Action } from "../src";

const ctx = makeContext(() => "2026-11-27T00:00:00Z");

function feeder() {
  let s = createEditor();
  const run = (a: Action) => (s = reduce(s, a, ctx));
  run({ type: "place", kind: "grid", x: 100, y: 40 });
  run({ type: "place", kind: "load", x: 100, y: 240 });
  const t = (name: string, role: string) =>
    s.project.terminals.find(
      (x) => x.deviceId === s.project.devices.find((d) => d.name === name)!.id && x.role === role,
    )!.id;
  run({ type: "connect", from: t("G1", "out"), to: t("L1", "in") });
  return s;
}

describe("buildScene", () => {
  it("draws devices and wires, wires first, wire ends on the terminals", () => {
    const s = feeder();
    const sc = buildScene(s.project, { results: s.results });
    expect(sc.elements.map((e) => e.kind)).toEqual(["wire", "device", "device"]);
    const w = sc.elements[0]!;
    expect(w.path![0]).toEqual({ x: 130, y: 100 });
    expect(w.path!.at(-1)).toEqual({ x: 130, y: 240 });
    expect(sc.bounds.w).toBeGreaterThan(0);
  });
  it("shows the load voltage and marks problems", () => {
    const s = feeder();
    const bad = {
      ...s.results,
      diagnostics: [
        { code: "x", severity: "error" as const, entities: [s.project.devices[1]!.id], params: {} },
        { code: "y", severity: "warning" as const, entities: [s.project.devices[1]!.id], params: {} },
      ],
    };
    const sc = buildScene(s.project, { results: s.results, diagnostics: bad.diagnostics });
    const load = sc.elements.find((e) => e.entityId === s.project.devices[1]!.id)!;
    expect(load.status).toBe("error");
    expect(load.prims.some((p) => p.t === "text" && p.cls === "value")).toBe(true);
  });
  it("draws one line per conductor when expanded", () => {
    const s = feeder();
    const w = s.project.wires[0]!;
    expect(buildScene(s.project).elements[0]!.prims).toHaveLength(1);
    const cable = s.project.cables[0]!;
    const two = {
      ...s.project,
      cables: [{ ...cable, conductors: [cable.conductors[0]!, { ...cable.conductors[0]!, role: "L2" as const }] }],
    };
    expect(buildScene(two, { expanded: [w.id] }).elements[0]!.prims).toHaveLength(2);
  });
  it("a busbar end slides along the bar", () => {
    let s = createEditor();
    const run = (a: Action) => (s = reduce(s, a, ctx));
    run({ type: "place", kind: "busbar", x: 0, y: 100 });
    run({ type: "place", kind: "load", x: 80, y: 240 });
    const bus = s.project.terminals.find((t) => t.role === "bus")!.id;
    run({ type: "connect", from: bus, to: s.project.terminals.find((t) => t.role === "in")!.id });
    const path = buildScene(s.project).elements[0]!.path!;
    expect(path[0]!.x).toBe(110);
    expect(path[0]!.y).toBe(108);
  });
  it("skips unplaced devices and wires without both ends, and culls by view", () => {
    const s = feeder();
    const unplaced = { ...s.project, placements: [] };
    expect(buildScene(unplaced).elements).toEqual([]);
    const sc = buildScene(s.project);
    expect(visibleIn(sc, { x: 0, y: 0, w: 50, h: 50 })).toHaveLength(0);
    expect(visibleIn(sc, { x: 100, y: 40, w: 100, h: 100 }).length).toBeGreaterThan(0);
  });
});
