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

/** Where a terminal is drawn. A busbar end slides along the bar toward `toward`. */
export function anchorOf(p: Project, terminalId: string, toward?: Point): Anchored | undefined {
  const t = p.terminals.find((x) => x.id === terminalId);
  const device = t && p.devices.find((d) => d.id === t.deviceId);
  const pos = device && positionOf(p, device.id);
  const sym = device && symbolFor(device.kind);
  const a = t && sym?.anchors[t.role];
  if (!device || !pos || !sym || !a) return undefined;
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
