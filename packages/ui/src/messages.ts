import { t, type Locale } from "@flow/i18n";
import type { Diagnostic } from "@flow/model";

function labelOf(locale: Locale, param: string): string {
  try {
    return t(locale, `param.${param}`);
  } catch {
    return param;
  }
}

/** Message for a diagnostic; if the catalog lacks a parameter the code itself is shown instead of failing. */
export function messageOf(locale: Locale, d: Diagnostic): string {
  try {
    const names = d.params["params"];
    const params =
      typeof names === "string" && d.code.endsWith("param.defaulted")
        ? {
            ...d.params,
            params: names
              .split(", ")
              .map((n) => labelOf(locale, n))
              .join(", "),
          }
        : d.params;
    return t(locale, `diag.${d.code}`, params);
  } catch {
    return d.code;
  }
}
