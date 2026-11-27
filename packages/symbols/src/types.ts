import type { TerminalRole } from "@flow/catalog";
import type { Point, Prim, Side } from "@flow/scene";

export interface Anchor {
  p: Point;
  side: Side;
}
export interface Symbol {
  w: number;
  h: number;
  prims: Prim[];
  anchors: Partial<Record<TerminalRole, Anchor>>;
  /** A bar that terminals can attach to anywhere along its length */
  bar?: boolean;
}
