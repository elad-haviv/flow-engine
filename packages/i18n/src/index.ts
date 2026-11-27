import en from "./catalogs/en.json";
import he from "./catalogs/he.json";
import { format, type Catalog, type Locale, type Params } from "./format";

export * from "./format";
export * from "./direction";
export * from "./numbers";
export const catalogs: Record<Locale, Catalog> = { he, en };
export const t = (locale: Locale, key: string, params?: Params): string =>
  format(catalogs[locale], locale, key, params);
