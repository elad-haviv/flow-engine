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

/** Pure reducer: the same state, action and context always give the same next state. */
export function reduce(s: EditorState, a: Action, ctx: ApplyContext): EditorState {
  switch (a.type) {
    case "tool":
      return { ...s, tool: a.tool };
    case "cancel":
      return { ...s, tool: { type: "select" }, selection: [] };
    case "select":
      return { ...s, selection: a.ids };
    case "expand":
      return { ...s, expanded: toggle(s.expanded, a.wireId) };
    case "undo":
      return undoStep(s);
    case "redo":
      return redoStep(s, ctx);
    case "place":
      return placeDevice(s, ctx, a.kind, a.x, a.y);
    case "move":
      return moveEntities(s, ctx, a.ids, a.dx, a.dy);
    case "connect":
      return connect(s, ctx, a.from, a.to);
    case "delete":
      return deleteEntities(s, ctx, a.ids);
    case "param":
      return setParam(s, ctx, a.deviceId, a.field, a.value);
    case "rename":
      return renameDevice(s, ctx, a.deviceId, a.name);
    case "state":
      return setState(s, ctx, a.deviceId, a.state);
    case "cable":
      return setCable(s, ctx, a.cableId, a.change);
    case "fix":
      return insertBusbar(s, ctx, a.terminalId);
  }
}
