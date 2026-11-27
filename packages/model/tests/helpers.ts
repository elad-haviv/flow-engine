import fc from "fast-check";
import { createProject, newId, type ApplyContext, type Command, type CommandPayloads, type CommandType, type Project } from "../src";

let n = 0;
export const ctx: ApplyContext = {
  newId: () => newId({ now: () => 1_700_000_000_000 + n, random: () => ((n++ * 13) % 997) / 997 }),
  now: () => "2026-11-27T00:00:00Z",
  terminalsFor: (k) => k === "load" ? [{ role: "in", conductors: [] }] : k === "bus" ? [{ role: "bus", conductors: [] }] : k === "grid" ? [{ role: "out", conductors: [] }] : undefined,
  paramValid: (_k, f, v) => f !== "bad" && v !== undefined,
  stateValid: (_k, s) => s === "open" || s === "closed",
};
export function cmd<T extends CommandType>(type: T, payload: CommandPayloads[T]): Command<T> {
  return { id: ctx.newId(), type, v: 1, at: ctx.now(), by: "local", payload };
}
export const base = (): Project => createProject("P", "he", { id: "il", edition: "2026" }, "0".repeat(26));
export const cu = { role: "L" as const, sectionMm2: 2.5, material: "Cu" as const, insulation: "PVC" as const };
export { fc };
