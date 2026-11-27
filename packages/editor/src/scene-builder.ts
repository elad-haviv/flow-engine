import type { Results } from "@flow/engine";
import type { Annotation, Diagnostic, Project } from "@flow/model";
import { symbolFor } from "@flow/symbols";
import type { Layer } from "./state";
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
  hidden?: Layer[];
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
      layer: "device",
      prims,
      bounds: { x: pos.x, y: pos.y, w: sym.w, h: sym.h },
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
      layer: "wire",
      prims: lines.map((l) => ({ t: "polyline", points: l, cls: "wire" })),
      bounds: pointsBounds(path, 4),
      path,
    };
    const s = status.get(w.id) ?? status.get(w.cableId);
    out.push(s ? { ...el, status: s } : el);
  }
  return out;
}

const outline = (x: number, y: number, w: number, h: number): Point[] => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h },
  { x, y },
];

function annotationPrims(a: Annotation): { prims: Prim[]; path?: Point[]; layer: Layer } {
  const { x, y } = a.placement;
  const w = a.placement.w ?? 0;
  const h = a.placement.h ?? 0;
  const label = (cls: string, dy: number): Prim[] =>
    a.text ? [{ t: "text", x: x + 6, y: y + dy, text: a.text, anchor: "start", cls }] : [];
  if (a.type === "text") return { layer: "annotation", prims: label("note", 14) };
  if (a.type === "arrow") {
    const head: Point[] = [
      { x: x + w - 10, y: y - 6 },
      { x: x + w, y },
      { x: x + w - 10, y: y + 6 },
    ];
    return {
      layer: "annotation",
      prims: [
        { t: "line", x1: x, y1: y, x2: x + w, y2: y, cls: "note-shape" },
        { t: "polyline", points: head, cls: "note-shape" },
      ],
      path: [
        { x, y },
        { x: x + w, y },
      ],
    };
  }
  const zone = a.style["zone"] === "1";
  const shape: Prim =
    a.type === "ellipse"
      ? { t: "ellipse", cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2, cls: "note-shape" }
      : { t: "rect", x, y, w, h, cls: zone ? "zone" : "note-shape" };
  return {
    layer: zone ? "zone" : "annotation",
    prims: [shape, ...label(zone ? "zone-label" : "note", 16)],
    path: outline(x, y, w, h),
  };
}

function annotationElements(p: Project): SceneElement[] {
  return p.annotations.map((a) => {
    const { prims, path, layer } = annotationPrims(a);
    const w = a.placement.w ?? 0;
    const h = a.placement.h ?? 0;
    const el: SceneElement = {
      id: a.id,
      entityId: a.id,
      layer,
      prims,
      bounds: {
        x: a.placement.x,
        y: a.placement.y - (a.type === "arrow" ? 8 : 0),
        w: Math.max(w, 1),
        h: Math.max(h, a.type === "arrow" ? 16 : 20),
      },
    };
    return path ? { ...el, path } : el;
  });
}

const ORDER: Layer[] = ["zone", "wire", "device", "annotation"];

/** The drawing description of a project: zones at the back, then wires, symbols and notes. Hidden layers are left out. */
export function buildScene(p: Project, opts: BuildOptions = {}): Scene {
  const status = worst(opts.diagnostics ?? opts.results?.diagnostics);
  const all = [
    ...annotationElements(p),
    ...wireElements(p, opts.expanded ?? [], status),
    ...deviceElements(p, status, opts.results),
  ];
  const hidden = new Set(opts.hidden ?? []);
  const elements = ORDER.flatMap((l) => (hidden.has(l) ? [] : all.filter((e) => e.layer === l)));
  return { elements, bounds: sceneBounds(elements) };
}

export const visibleIn = (s: Scene, view: { x: number; y: number; w: number; h: number }): SceneElement[] =>
  s.elements.filter((e) => rectsOverlap(e.bounds, view));
