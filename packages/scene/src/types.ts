export interface Point {
  x: number;
  y: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type Side = "top" | "bottom" | "left" | "right";

/** Drawing primitives. `cls` is a style hook the renderer maps to colours and stroke widths. */
export type Prim =
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; cls?: string }
  | { t: "rect"; x: number; y: number; w: number; h: number; cls?: string }
  | { t: "circle"; cx: number; cy: number; r: number; cls?: string }
  | { t: "path"; d: string; cls?: string }
  | { t: "polyline"; points: Point[]; cls?: string }
  | { t: "text"; x: number; y: number; text: string; anchor?: "start" | "middle" | "end"; cls?: string };

export type SceneLayer = "device" | "wire" | "annotation";

export interface SceneElement {
  /** Stable key for rendering */
  id: string;
  /** Model entity this element draws */
  entityId: string;
  layer: SceneLayer;
  prims: Prim[];
  bounds: Rect;
  /** Worst problem on this entity, for the renderer */
  status?: "error" | "warning";
  /** Wires: the polyline used for hit testing */
  path?: Point[];
}

export interface Scene {
  elements: SceneElement[];
  bounds: Rect;
}
