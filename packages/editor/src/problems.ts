import { ENGINE_CODES, type Results } from "@flow/engine";
import type { Diagnostic } from "@flow/model";

export interface Problem {
  id: string;
  diagnostic: Diagnostic;
  /** A one-click fix the editor can apply */
  fix?: { type: "busbar"; terminalId: string };
}

const rank = { error: 0, warning: 1, info: 2 } as const;

/** Problems for the panel: engine diagnostics, errors first. Info entries that only inform stay in the list but last. */
export function problemsOf(results: Results): Problem[] {
  return results.diagnostics
    .map((diagnostic, i): Problem => {
      const id = `${diagnostic.code}#${i}`;
      return diagnostic.code === ENGINE_CODES.busbarSuggest && diagnostic.entities[0]
        ? { id, diagnostic, fix: { type: "busbar", terminalId: diagnostic.entities[0] } }
        : { id, diagnostic };
    })
    .sort((a, b) => rank[a.diagnostic.severity] - rank[b.diagnostic.severity]);
}
