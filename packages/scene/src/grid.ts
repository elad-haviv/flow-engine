import { rectsOverlap } from "./geometry";
import type { Rect } from "./types";

/** Uniform grid index over element bounds, so a view only looks at elements near the viewport. */
export class SpatialGrid {
  private cells = new Map<string, Set<string>>();
  private boxes = new Map<string, Rect>();
  constructor(private cell = 200) {}

  private keys(r: Rect): string[] {
    const out: string[] = [];
    for (let i = Math.floor(r.x / this.cell); i <= Math.floor((r.x + r.w) / this.cell); i++)
      for (let j = Math.floor(r.y / this.cell); j <= Math.floor((r.y + r.h) / this.cell); j++) out.push(`${i},${j}`);
    return out;
  }

  insert(id: string, r: Rect): void {
    this.remove(id);
    this.boxes.set(id, r);
    for (const k of this.keys(r)) (this.cells.get(k) ?? this.cells.set(k, new Set()).get(k)!).add(id);
  }

  remove(id: string): void {
    const r = this.boxes.get(id);
    if (!r) return;
    for (const k of this.keys(r)) this.cells.get(k)?.delete(id);
    this.boxes.delete(id);
  }

  /** Ids whose bounds overlap the rectangle. */
  query(r: Rect): string[] {
    const seen = new Set<string>();
    for (const k of this.keys(r))
      for (const id of this.cells.get(k) ?? []) if (rectsOverlap(this.boxes.get(id)!, r)) seen.add(id);
    return [...seen];
  }
}
