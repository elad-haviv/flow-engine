import { z } from "zod";
import type { Command } from "../commands/types";

export const JOURNAL_LIMIT = 5000;

export const commandSchema = z.object({
  id: z.string(),
  type: z.string(),
  v: z.number().int().positive(),
  at: z.string(),
  by: z.string(),
  ids: z.array(z.string()).optional(),
  payload: z.record(z.string(), z.unknown()),
});

export type Journal = Command[];

/** Append a command, dropping the oldest beyond the retention limit. */
export function append(journal: Journal, cmd: Command, limit: number = JOURNAL_LIMIT): Journal {
  const next = [...journal, cmd];
  return next.length > limit ? next.slice(next.length - limit) : next;
}
