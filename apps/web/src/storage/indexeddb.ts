import type { ProjectStorage } from "@flow/platform";

interface Row {
  id: string;
  name: string;
  revision: string;
  text: string;
}
const STORE = "projects";

function open(factory: IDBFactory, dbName: string): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const rq = factory.open(dbName, 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore(STORE, { keyPath: "id" });
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}
function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

/** Autosave in the browser. It is not a backup: the shell tells the user so. */
export function indexedDbStorage(factory: IDBFactory = indexedDB, dbName = "flow-engine"): ProjectStorage {
  const db = open(factory, dbName);
  const store = async (mode: IDBTransactionMode) => (await db).transaction(STORE, mode).objectStore(STORE);
  return {
    async list() {
      const rows = await req((await store("readonly")).getAll() as IDBRequest<Row[]>);
      return rows.map(({ id, name, revision }) => ({ id, name, revision }));
    },
    async load(id) {
      const row = await req((await store("readonly")).get(id) as IDBRequest<Row | undefined>);
      return row?.text;
    },
    async save(id, name, text, previousRevision) {
      const s = await store("readwrite");
      const existing = await req(s.get(id) as IDBRequest<Row | undefined>);
      if (existing && previousRevision !== undefined && existing.revision !== previousRevision)
        throw new Error("storage.revision_conflict");
      const revision = String(Number(existing?.revision ?? "0") + 1);
      await req(s.put({ id, name, revision, text } satisfies Row));
      return revision;
    },
    async remove(id) {
      await req((await store("readwrite")).delete(id));
    },
  };
}
