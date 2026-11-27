import { getComponent } from "@flow/catalog";
import { type Device, type Endpoint, type Project } from "@flow/model";
import { symbolFor } from "@flow/symbols";
import type { Point, Side } from "@flow/scene";

export const GRID = 20;
export const VIEW = "main";
export const snap = (v: number): number => Math.round(v / GRID) * GRID;

export const positionOf = (p: Project, entityId: string): Point | undefined => {
  const pl = p.placements.find((x) => x.entityId === entityId && x.viewId === VIEW);
  return pl ? { x: pl.x, y: pl.y } : undefined;
};

/** Terminal id a wire end refers to. A promoted junction resolves to its terminal; a free junction has none. */
export const terminalOf = (p: Project, e: Endpoint): string | undefined =>
  "terminalId" in e ? e.terminalId : p.junctions.find((j) => j.id === e.junctionId)?.terminalId;

export interface Anchored {
  p: Point;
  side: Side;
  device: Device;
}

/** The device, its position, its symbol and the anchor a terminal sits at. */
function placed(p: Project, terminalId: string) {
  const t = p.terminals.find((x) => x.id === terminalId);
  const device = t && p.devices.find((d) => d.id === t.deviceId);
  const pos = device && positionOf(p, device.id);
  const sym = device && symbolFor(device.kind);
  const a = t && sym?.anchors[t.role];
  return device && pos && sym && a ? { device, pos, sym, a } : undefined;
}

/** Where a terminal is drawn. A busbar end slides along the bar toward `toward`. */
export function anchorOf(p: Project, terminalId: string, toward?: Point): Anchored | undefined {
  const f = placed(p, terminalId);
  if (!f) return undefined;
  const { device, pos, sym, a } = f;
  if (!sym.bar || !toward) return { p: { x: pos.x + a.p.x, y: pos.y + a.p.y }, side: a.side, device };
  const x = Math.max(pos.x + 6, Math.min(pos.x + sym.w - 6, toward.x));
  const below = toward.y > pos.y + sym.h / 2;
  return { p: { x, y: pos.y + (below ? sym.h - 2 : 2) }, side: below ? "bottom" : "top", device };
}

/** Power system a terminal carries, for choosing default conductors. */
export function systemOf(p: Project, terminalId: string): "ac3" | "ac1" | "dc" | "loop" {
  const t = p.terminals.find((x) => x.id === terminalId);
  const d = t && p.devices.find((x) => x.id === t.deviceId);
  const def = d && getComponent(d.kind);
  if (!d || !def || !t) return "ac3";
  if (t.role === "out" && def.outputSystem) return def.outputSystem;
  const explicit = d.params["system"];
  return (typeof explicit === "string" ? explicit : def.systems[0]) as "ac3" | "ac1" | "dc" | "loop";
}

/** Terminal under a point: a terminal anchor within `radius`, or any point along a busbar for its bus terminal. */
export function terminalAtPoint(p: Project, at: Point, radius = 12): string | undefined {
  for (const t of p.terminals) {
    const f = placed(p, t.id);
    if (!f) continue;
    const { pos, sym, a } = f;
    const hit = sym.bar
      ? at.x >= pos.x - radius &&
        at.x <= pos.x + sym.w + radius &&
        at.y >= pos.y - radius &&
        at.y <= pos.y + sym.h + radius
      : Math.hypot(at.x - (pos.x + a.p.x), at.y - (pos.y + a.p.y)) <= radius;
    if (hit) return t.id;
  }
  return undefined;
}

export interface Marker {
  terminalId: string;
  p: Point;
}
/** Dots drawn on terminals while wiring. */
export function terminalMarkers(p: Project): Marker[] {
  const out: Marker[] = [];
  for (const t of p.terminals) {
    const a = anchorOf(p, t.id);
    if (a) out.push({ terminalId: t.id, p: a.p });
  }
  return out;
}
