import {
  append,
  applyCommand,
  applyInverse,
  type ApplyContext,
  type Command,
  type CommandPayloads,
  type CommandType,
  type Project,
} from "@flow/model";
import { analyse, type EditorState, type Step } from "./state";

export const command = <T extends CommandType>(
  ctx: ApplyContext,
  type: T,
  payload: CommandPayloads[T],
): Command<T> => ({
  id: ctx.newId(),
  type,
  v: 1,
  at: ctx.now(),
  by: "local",
  payload,
});

export interface Tx {
  /** Apply a command inside the step; returns the project afterwards, or undefined if it was rejected. */
  run: <T extends CommandType>(type: T, payload: CommandPayloads[T]) => Project | undefined;
  readonly project: Project;
}

/**
 * Runs a user step made of several commands. If any command is rejected the whole step is dropped,
 * the state keeps its project, and `rejected` holds the code.
 */
export function transact(state: EditorState, ctx: ApplyContext, body: (tx: Tx) => void): EditorState {
  let project = state.project;
  const commands: Command[] = [];
  const inverses: Step["inverses"] = [];
  let rejected: string | undefined;
  const tx: Tx = {
    get project() {
      return project;
    },
    run: (type, payload) => {
      if (rejected) return undefined;
      const r = applyCommand(project, command(ctx, type, payload), ctx);
      if (!r.ok) {
        rejected = r.diagnostic.code;
        return undefined;
      }
      project = r.project;
      commands.push(r.command);
      inverses.push(r.inverse);
      return project;
    },
  };
  body(tx);
  if (rejected) return { ...state, rejected };
  if (!commands.length) return state;
  const journal = commands.reduce((j, c) => append(j, c), state.journal);
  const { rejected: _drop, ...rest } = state;
  void _drop;
  return {
    ...rest,
    project,
    journal,
    undo: [...state.undo, { commands, inverses }],
    redo: [],
    results: analyse(project, state.profile),
  };
}

export function undoStep(state: EditorState): EditorState {
  const step = state.undo.at(-1);
  if (!step) return state;
  let p = state.project;
  for (let i = step.inverses.length - 1; i >= 0; i--) p = applyInverse(p, step.inverses[i]!);
  return {
    ...state,
    project: p,
    undo: state.undo.slice(0, -1),
    redo: [...state.redo, step],
    selection: [],
    results: analyse(p, state.profile),
  };
}

export function redoStep(state: EditorState, ctx: ApplyContext): EditorState {
  const step = state.redo.at(-1);
  if (!step) return state;
  let p = state.project;
  const inverses: Step["inverses"] = [];
  for (const c of step.commands) {
    const r = applyCommand(p, c, ctx);
    if (!r.ok) return { ...state, redo: [], rejected: r.diagnostic.code };
    p = r.project;
    inverses.push(r.inverse);
  }
  return {
    ...state,
    project: p,
    redo: state.redo.slice(0, -1),
    undo: [...state.undo, { commands: step.commands, inverses }],
    results: analyse(p, state.profile),
  };
}
