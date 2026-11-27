export type Locale = "he" | "en";
export type Catalog = Record<string, string>;
export type Params = Record<string, string | number>;

/** Replace {param} placeholders; choose plural variant by `count` using Intl.PluralRules (_one, _two, _other). */
export function format(catalog: Catalog, locale: Locale, key: string, params: Params = {}): string {
  let k = key;
  if (typeof params["count"] === "number") {
    const cat = new Intl.PluralRules(locale).select(params["count"]);
    const variant = `${key}_${cat}`;
    k = variant in catalog ? variant : `${key}_other` in catalog ? `${key}_other` : key;
  }
  const msg = catalog[k];
  if (msg === undefined) throw new Error(`i18n.missing_key: ${key}`);
  return msg.replace(/\{(\w+)\}/g, (_m, name: string) => {
    const v = params[name];
    if (v === undefined) throw new Error(`i18n.missing_param: ${name} in ${key}`);
    return String(v);
  });
}

export const placeholders = (msg: string): string[] => [...msg.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();
