import { SCHEMA_VERSION } from "../../schema/project";

export type RawDoc = Record<string, unknown>;
/** migrations[n] converts a version-n document to version n+1. */
export const migrations: Record<number, (doc: RawDoc) => RawDoc> = {};

export function migrate(doc: RawDoc, from: number): RawDoc {
  let d = doc;
  for (let v = from; v < SCHEMA_VERSION; v++) {
    const step = migrations[v];
    if (!step) throw new Error(`model.file.no_migration: ${v}`);
    d = step(d);
  }
  return d;
}
