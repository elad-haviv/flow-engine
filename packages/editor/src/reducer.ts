import type { ApplyContext } from "@flow/model";
import {
  connect,
  deleteEntities,
  moveEntities,
  placeDevice,
  renameDevice,
  setCable,
  setParam,
  setState,
} from "./edits";
import { insertBusbar } from "./fixes";
import type { EditorState, Tool } from "./state";
import { redoStep, undoStep } from "./transaction";

type EditArgs<F> = F extends (s: EditorState, c: ApplyContext, ...a: infer A) => EditorState ? A : never;

export type Action =
  | { type: "tool"; tool: Tool }
  | { type: "cancel" }
  | { type: "select"; ids: string[] }
  | { type: "expand"; wireId: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "place"; kind: string; x: number; y: number }
  | { type: "move"; ids: string[]; dx: number; dy: number }
  | { type: "connect"; from: string; to: string }
  | { type: "delete"; ids: string[] }
  | { type: "param"; deviceId: string; field: string; value: EditArgs<typeof setParam>[2] }
  | { type: "rename"; deviceId: string; name: string }
  | { type: "state"; deviceId: string; state: "closed" | "open" | "grounded" }
  | { type: "cable"; cableId: string; change: EditArgs<typeof setCable>[1] }
  | { type: "fix"; terminalId: string };

const toggle = (list: string[], id: string): string[] =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

type Handler<A extends Action> = (s: EditorState, a: A, ctx: ApplyContext) => EditorState;
type Table = { [K in Action["type"]]: Handler<Extract<Action, { type: K }>> };

const TABLE: Table = {
  tool: (s, a) => ({ ...s, tool: a.tool }),
  cancel: (s) => ({ ...s, tool: { type: "select" }, selection: [] }),
  select: (s, a) => ({ ...s, selection: a.ids }),
  expand: (s, a) => ({ ...s, expanded: toggle(s.expanded, a.wireId) }),
  undo: (s) => undoStep(s),
  redo: (s, _a, ctx) => redoStep(s, ctx),
  place: (s, a, ctx) => placeDevice(s, ctx, a.kind, a.x, a.y),
  move: (s, a, ctx) => moveEntities(s, ctx, a.ids, a.dx, a.dy),
  connect: (s, a, ctx) => connect(s, ctx, a.from, a.to),
  delete: (s, a, ctx) => deleteEntities(s, ctx, a.ids),
  param: (s, a, ctx) => setParam(s, ctx, a.deviceId, a.field, a.value),
  rename: (s, a, ctx) => renameDevice(s, ctx, a.deviceId, a.name),
  state: (s, a, ctx) => setState(s, ctx, a.deviceId, a.state),
  cable: (s, a, ctx) => setCable(s, ctx, a.cableId, a.change),
  fix: (s, a, ctx) => insertBusbar(s, ctx, a.terminalId),
};

/** Pure reducer: the same state, action and context always give the same next state. */
export function reduce(s: EditorState, a: Action, ctx: ApplyContext): EditorState {
  return (TABLE[a.type] as Handler<Action>)(s, a, ctx);
}

export interface KeyInfo {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

/** Keyboard shortcut to action. While typing in a field only Escape applies. */
export function keyToAction(e: KeyInfo, typing: boolean, selection: string[]): Action | undefined {
  if (e.key === "Escape") return { type: "cancel" };
  if (typing) return undefined;
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if ((e.key === "Delete" || e.key === "Backspace") && selection.length) return { type: "delete", ids: selection };
  if (mod && k === "z") return { type: e.shiftKey ? "redo" : "undo" };
  if (mod && k === "y") return { type: "redo" };
  return undefined;
}
