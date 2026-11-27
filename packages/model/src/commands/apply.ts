import { CODES } from "../diagnostics/codes";
import type { Diagnostic } from "../diagnostics/diagnostic";
import type { Project } from "../schema/project";
import { applyChanges, invertChanges, type Change } from "./changes";
import type { ApplyContext } from "./context";
import { fail, ok, type Handler } from "./handlers";
import * as core from "./handlers-core";
import * as misc from "./handlers-misc";
import type { Command, CommandType } from "./types";

type AnyHandler = (p: Project, pl: never, ctx: ApplyContext, cmd: Command) => ReturnType<Handler<"project.rename">>;

const batchHandler: Handler<"batch"> = (p, pl, ctx) => {
  let cur = p;
  const all: Change[] = [];
  for (const c of pl.commands) {
    const r = applyCommand(cur, c, ctx);
    if (!r.ok) return { ok: false, diagnostic: r.diagnostic };
    cur = r.project;
    all.push(...r.changes);
  }
  return ok(all);
};

const HANDLERS: Partial<Record<CommandType, AnyHandler>> = {
  "project.rename": core.projectRename as AnyHandler,
  "device.add": core.deviceAdd as AnyHandler,
  "device.remove": core.deviceRemove as AnyHandler,
  "device.setParam": core.deviceSetParam as AnyHandler,
  "device.setState": core.deviceSetState as AnyHandler,
  "wire.add": core.wireAdd as AnyHandler,
  "wire.remove": core.wireRemove as AnyHandler,
  "cable.setConductor": core.cableSetConductor as AnyHandler,
  "junction.promote": misc.junctionPromote as AnyHandler,
  "junction.demote": misc.junctionDemote as AnyHandler,
  "circuit.create": misc.circuitCreate as AnyHandler,
  "circuit.setMembers": misc.circuitSetMembers as AnyHandler,
  "circuit.remove": misc.circuitRemove as AnyHandler,
  "placement.set": misc.placementSet as AnyHandler,
  "annotation.add": misc.annotationAdd as AnyHandler,
  "annotation.set": misc.annotationSet as AnyHandler,
  "annotation.remove": misc.annotationRemove as AnyHandler,
  batch: batchHandler as AnyHandler,
};

export type Applied =
  | { ok: true; project: Project; changes: Change[]; inverse: Change[]; command: Command }
  | { ok: false; diagnostic: Diagnostic };

/** Apply one command to a project. Returns the next project and the change record, or a rejection. */
export function applyCommand(p: Project, cmd: Command, ctx: ApplyContext): Applied {
  const h = HANDLERS[cmd.type];
  if (!h) {
    const f = fail(CODES.commandUnknown);
    return { ok: false, diagnostic: (f as { diagnostic: Diagnostic }).diagnostic };
  }
  const queue = [...(cmd.ids ?? [])];
  const made: string[] = [];
  const wrapped: ApplyContext = {
    ...ctx,
    newId: () => {
      const id = queue.shift() ?? ctx.newId();
      made.push(id);
      return id;
    },
  };
  const r = h(p, cmd.payload as never, wrapped, cmd);
  if (!r.ok) return r;
  const command = made.length ? { ...cmd, ids: made } : cmd;
  return {
    ok: true,
    project: applyChanges(p, r.changes),
    changes: r.changes,
    inverse: invertChanges(r.changes),
    command,
  };
}

/** Apply an inverse change record (undo). */
export function applyInverse(p: Project, inverse: Change[]): Project {
  return applyChanges(p, inverse);
}
