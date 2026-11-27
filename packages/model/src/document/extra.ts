/** Unknown-data retention: fields the schema does not know are kept at a stable path, never dropped. */
export interface ExtraEntry {
  path: string[];
  value: unknown;
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

export function collectExtra(raw: unknown, parsed: unknown, path: string[] = [], out: ExtraEntry[] = []): ExtraEntry[] {
  if (Array.isArray(raw) && Array.isArray(parsed)) {
    raw.forEach((r, i) => {
      const p = parsed[i];
      const id = isObj(p) && typeof p["id"] === "string" ? `#${p["id"]}` : `@${i}`;
      collectExtra(r, p, [...path, id], out);
    });
  } else if (isObj(raw) && isObj(parsed)) {
    for (const k of Object.keys(raw)) {
      if (path.length === 0 && k === "extra") continue;
      if (!(k in parsed)) out.push({ path: [...path, k], value: raw[k] });
      else collectExtra(raw[k], parsed[k], [...path, k], out);
    }
  }
  return out;
}
