import type { Command } from "../../commands/types";

export const CURRENT_COMMAND_VERSION = 1;

type Upcaster = (c: Command) => Command;

/** upcasters[type][fromVersion] turns a stored command into version fromVersion+1. Stored commands are never rewritten. */
export const upcasters: Record<string, Record<number, Upcaster>> = {};

export function upcast(cmd: Command): Command {
  let c = cmd;
  const steps = upcasters[c.type] ?? {};
  while (c.v < CURRENT_COMMAND_VERSION) {
    const step = steps[c.v];
    if (!step) break;
    c = step(c);
  }
  return c;
}
