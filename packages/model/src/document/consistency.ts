import { applyCommand } from "../commands/apply";
import type { ApplyContext } from "../commands/context";
import type { CommandPayloads } from "../commands/types";
import { CODES } from "../diagnostics/codes";
import { diagnostic, type Diagnostic } from "../diagnostics/diagnostic";
import { createProject } from "../project/create";
import type { Doc } from "./document";

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Replays a journal that starts at project.create and compares the result to the stored model.
 * The document always wins: a mismatch is a warning, never a reason to change the model.
 * A truncated journal (not starting at project.create) cannot be replayed and is skipped.
 */
export function checkConsistency(doc: Doc, ctx: ApplyContext): Diagnostic[] {
  const first = doc.journal[0];
  if (!first || first.type !== "project.create") return [];
  const pl = first.payload as CommandPayloads["project.create"];
  let p = createProject(pl.name, pl.locale, pl.profile, doc.project.id);
  for (const c of doc.journal.slice(1)) {
    const r = applyCommand(p, c, ctx);
    if (!r.ok) return [diagnostic(CODES.fileJournalMismatch, "warning", [], { command: c.id })];
    p = r.project;
  }
  return same(p, doc.project) ? [] : [diagnostic(CODES.fileJournalMismatch, "warning")];
}
