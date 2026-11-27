export type Severity = "error" | "warning" | "info";

export interface Diagnostic {
  code: string;
  severity: Severity;
  entities: string[];
  params: Record<string, string | number>;
}

export function diagnostic(
  code: string,
  severity: Severity,
  entities: string[] = [],
  params: Record<string, string | number> = {},
): Diagnostic {
  return { code, severity, entities, params };
}
