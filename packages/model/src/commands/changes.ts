import type { Project } from "../schema/project";

export type Coll =
  "devices" | "terminals" | "cables" | "wires" | "junctions" | "circuits" | "panels" | "placements" | "annotations";

export interface Entity {
  id: string;
}

/** One entity-level change. `before`/`after` undefined means absent. */
export interface Change {
  coll: Coll | "project";
  id: string;
  before?: unknown;
  after?: unknown;
  /** Position the entity had when removed, so undo restores array order. */
  index?: number;
}

export function getAll(p: Project, c: Coll): Entity[] {
  return p[c] as unknown as Entity[];
}

function setAll(p: Project, c: Coll, v: Entity[]): Project {
  return { ...p, [c]: v } as Project;
}

/** Apply changes forward. */
export function applyChanges(p: Project, changes: Change[]): Project {
  let out = p;
  for (const ch of changes) {
    if (ch.coll === "project") {
      out = { ...out, ...(ch.after as object) };
      continue;
    }
    const all = getAll(out, ch.coll);
    const idx = all.findIndex((e) => e.id === ch.id);
    const list = all.filter((e) => e.id !== ch.id);
    const after = ch.after as Entity | undefined;
    if (after) list.splice(idx >= 0 ? idx : (ch.index ?? list.length), 0, after);
    out = setAll(out, ch.coll, list);
  }
  return out;
}

/** Invert a change list: swap before/after and reverse order. */
export function invertChanges(changes: Change[]): Change[] {
  return changes.map((c) => ({ ...c, before: c.after, after: c.before })).reverse();
}
