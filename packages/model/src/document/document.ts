import { z, type ZodError } from "zod";
import { CODES } from "../diagnostics/codes";
import { diagnostic, type Diagnostic } from "../diagnostics/diagnostic";
import { commandSchema, type Journal } from "../journal/journal";
import { upcast } from "../journal/upcasters";
import { SCHEMA_VERSION, projectSchema, type Project } from "../schema/project";
import type { Command } from "../commands/types";
import { collectExtra, type ExtraEntry } from "./extra";
import { migrate, type RawDoc } from "./migrations";

export const FORMAT = "flow-project";

const extraSchema = z.array(z.object({ path: z.array(z.string()), value: z.unknown() }));
const docSchema = z.object({
  format: z.literal(FORMAT),
  schemaVersion: z.number().int().positive(),
  project: projectSchema,
  journal: z.array(commandSchema),
  extra: extraSchema.optional(),
});

export interface Doc { project: Project; journal: Journal; extra: ExtraEntry[] }
export type LoadResult =
  | { ok: true; doc: Doc; diagnostics: Diagnostic[] }
  | { ok: false; diagnostics: Diagnostic[] };

function zodDiags(e: ZodError): Diagnostic[] {
  return e.issues.slice(0, 20).map((i) => diagnostic(CODES.fileInvalid, "error", [], { path: i.path.join("."), message: i.message }));
}

export function saveDocument(doc: Doc): string {
  const out = { format: FORMAT, schemaVersion: SCHEMA_VERSION, project: doc.project, journal: doc.journal, extra: doc.extra };
  return JSON.stringify(out);
}

export function loadDocument(text: string): LoadResult {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, diagnostics: [diagnostic(CODES.fileInvalid, "error", [], { message: "not JSON" })] }; }
  if (typeof raw !== "object" || raw === null || (raw as RawDoc)["format"] !== FORMAT) {
    return { ok: false, diagnostics: [diagnostic(CODES.fileInvalid, "error", [], { message: "not a project file" })] };
  }
  const from = (raw as RawDoc)["schemaVersion"];
  if (typeof from !== "number") return { ok: false, diagnostics: [diagnostic(CODES.fileInvalid, "error", [], { message: "no schemaVersion" })] };
  if (from > SCHEMA_VERSION) return { ok: false, diagnostics: [diagnostic(CODES.fileUnsupportedVersion, "error", [], { found: from, supported: SCHEMA_VERSION })] };
  let migrated: RawDoc;
  try { migrated = migrate(raw as RawDoc, from); } catch (e) {
    return { ok: false, diagnostics: [diagnostic(CODES.fileInvalid, "error", [], { message: String(e) })] };
  }
  const parsed = docSchema.safeParse(migrated);
  if (!parsed.success) return { ok: false, diagnostics: zodDiags(parsed.error) };
  const extra = [...(parsed.data.extra ?? []), ...collectExtra(migrated, parsed.data)];
  const diags = collectExtra(migrated, parsed.data).map((x) => diagnostic(CODES.fileUnknownField, "warning", [], { path: x.path.join("/") }));
  const journal = parsed.data.journal.map((c) => upcast(c as unknown as Command));
  return { ok: true, doc: { project: parsed.data.project, journal, extra }, diagnostics: diags };
}
