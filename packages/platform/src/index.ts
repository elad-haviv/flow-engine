/** Interfaces only. Adapters live in apps/web (Phase 0) and packages/editions (Phase 6). */
export interface ProjectStorage {
  list(): Promise<Array<{ id: string; name: string; revision: string }>>;
  load(id: string): Promise<string | undefined>;
  /** Writes a temporary copy and replaces, so a crash cannot leave half a project. Returns the new revision. */
  save(id: string, name: string, text: string, previousRevision?: string): Promise<string>;
  remove(id: string): Promise<void>;
}
export interface FileAccess {
  open(): Promise<{ name: string; text: string } | undefined>;
  saveAs(suggestedName: string, text: string): Promise<void>;
}
export interface Identity {
  current(): { id: string };
}
export interface Licence {
  capabilities(): ReadonlySet<string>;
}
export interface Clock {
  now(): number;
}
