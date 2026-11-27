import { CODES } from "../diagnostics/codes";
import { diagnostic } from "../diagnostics/diagnostic";
import type { Project, Wire } from "../schema/project";
import { nodeKey } from "../topology";
import { getAll, type Change, type Coll, type Entity } from "./changes";
import type { ApplyContext, ApplyResult } from "./context";
import type { Command, CommandPayloads } from "./types";

export const fail = (code: string, entities: string[] = []): ApplyResult =>
  ({ ok: false, diagnostic: diagnostic(code, "error", entities) });
export const ok = (changes: Change[]): ApplyResult => ({ ok: true, changes });

export function find<T extends Entity>(p: Project, c: Coll, id: string): T | undefined {
  return getAll(p, c).find((e) => e.id === id) as T | undefined;
}
export function add<T extends Entity>(coll: Coll, entity: T): Change {
  return { coll, id: entity.id, after: entity };
}
export function remove(p: Project, coll: Coll, id: string): Change {
  const index = getAll(p, coll).findIndex((e) => e.id === id);
  return { coll, id, before: getAll(p, coll)[index], index };
}
export function update<T extends Entity>(p: Project, coll: Coll, id: string, after: T): Change {
  return { coll, id, before: find(p, coll, id), after };
}

export type Handler<T extends keyof CommandPayloads> = (p: Project, pl: CommandPayloads[T], ctx: ApplyContext, cmd: Command) => ApplyResult;

export function endpointExists(p: Project, e: Wire["from"]): boolean {
  if ("terminalId" in e) return !!find(p, "terminals", e.terminalId);
  return !!find(p, "junctions", e.junctionId);
}

export function wiresAt(p: Project, key: string): Wire[] {
  return p.wires.filter((w) => nodeKey(p, w.from) === key || nodeKey(p, w.to) === key);
}
