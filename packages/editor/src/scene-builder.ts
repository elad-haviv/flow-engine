import type { Results } from "@flow/engine";
import type { Diagnostic, Project } from "@flow/model";
import { symbolFor } from "@flow/symbols";
import {
  pointsBounds,
  rectsOverlap,
  routeWire,
  sceneBounds,
  translate,
  type Point,
  type Prim,
  type Scene,
  type SceneElement,
} from "@flow/scene";
import { anchorOf, positionOf, terminalOf } from "./layout";

export interface BuildOptions {
  expanded?: string[];
  results?: Results;
  diagnostics?: Diagnostic[];
}

function worst(diags: Diagnostic[] | undefined): Map<string, "error" | "warning"> {
  const m = new Map<string, "error" | "warning">();
  for (const d of diags ?? []) {
    if (d.severity === "info") continue;
    for (const e of d.entities) if (d.severity === "error" || !m.has(e)) m.set(e, d.severity);
  }
  return m;
}

/** Offsets for drawing a cable as separate conductors side by side. */
const spread = (n: number): number[] => Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * 5);

function offsetPath(path: Point[], d: number): Point[] {
  return path.map((p, i) => {
    const a = path[Math.max(0, i - 1)]!;
    const b = path[Math.min(path.length - 1, i + 1)]!;
    const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
    return horizontal ? { x: p.x, y: p.y + d } : { x: p.x + d, y: p.y };
  });
}

function deviceElements(p: Project, status: Map<string, "error" | "warning">, results?: Results): SceneElement[] {
  const out: SceneElement[] = [];
  for (const d of p.devices) {
    const pos = positionOf(p, d.id);
    const sym = symbolFor(d.kind);
    if (!pos || !sym) continue;
    const prims: Prim[] = sym.prims.map((x) => translate(x, pos.x, pos.y));
    prims.push({
      t: "text",
      x: pos.x + sym.w / 2,
      y: pos.y + sym.h + 14,
      text: d.name,
      anchor: "middle",
      cls: "label",
    });
    const load = results?.loads.find((l) => l.deviceId === d.id);
    if (load)
      prims.push({
        t: "text",
        x: pos.x + sym.w / 2,
        y: pos.y + sym.h + 28,
        text: `${Math.round(load.voltage.value)} V`,
        anchor: "middle",
        cls: "value",
      });
    const el: SceneElement = {
      id: d.id,
      entityId: d.id,
      kind: "device",
      prims,
      bounds: { x: pos.x, y: pos.y, w: sym.w, h: sym.h + 32 },
    };
    const s = status.get(d.id);
    out.push(s ? { ...el, status: s } : el);
  }
  return out;
}

function wireElements(p: Project, expanded: string[], status: Map<string, "error" | "warning">): SceneElement[] {
  const out: SceneElement[] = [];
  for (const w of p.wires) {
    const ta = terminalOf(p, w.from);
    const tb = terminalOf(p, w.to);
    if (!ta || !tb) continue;
    const pa = anchorOf(p, ta);
    const pb = anchorOf(p, tb);
    if (!pa || !pb) continue;
    const a = anchorOf(p, ta, pb.p) ?? pa;
    const b = anchorOf(p, tb, a.p) ?? pb;
    const path = routeWire(a.p, a.side, b.p, b.side);
    const cable = p.cables.find((c) => c.id === w.cableId);
    const lines =
      expanded.includes(w.id) && cable ? spread(cable.conductors.length).map((d) => offsetPath(path, d)) : [path];
    const el: SceneElement = {
      id: w.id,
      entityId: w.id,
      kind: "wire",
      prims: lines.map((l) => ({ t: "polyline", points: l, cls: "wire" })),
      bounds: pointsBounds(path, 4),
      path,
    };
    const s = status.get(w.id) ?? status.get(w.cableId);
    out.push(s ? { ...el, status: s } : el);
  }
  return out;
}

/** The drawing description of a project: wires first so symbols draw over them. */
export function buildScene(p: Project, opts: BuildOptions = {}): Scene {
  const status = worst(opts.diagnostics ?? opts.results?.diagnostics);
  const elements = [...wireElements(p, opts.expanded ?? [], status), ...deviceElements(p, status, opts.results)];
  return { elements, bounds: sceneBounds(elements) };
}

export const visibleIn = (s: Scene, view: { x: number; y: number; w: number; h: number }): SceneElement[] =>
  s.elements.filter((e) => rectsOverlap(e.bounds, view));
