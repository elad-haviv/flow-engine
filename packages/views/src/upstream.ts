import { getComponent } from "@flow/catalog";
import { nodeKey, type Device, type Project } from "@flow/model";

const deviceOfTerminal = (p: Project, terminalId: string): Device | undefined => {
  const t = p.terminals.find((x) => x.id === terminalId);
  return t && p.devices.find((d) => d.id === t.deviceId);
};

/** Terminals joined to this one by a wire, with the wire that joins them. */
function neighbours(p: Project, terminalId: string): Array<{ terminal: string; wireId: string }> {
  const out: Array<{ terminal: string; wireId: string }> = [];
  for (const w of p.wires) {
    const a = nodeKey(p, w.from);
    const b = nodeKey(p, w.to);
    if (a === terminalId) out.push({ terminal: b, wireId: w.id });
    else if (b === terminalId) out.push({ terminal: a, wireId: w.id });
  }
  return out;
}

/** Terminals of the same device other than `except`, marked as seen. */
function otherTerminals(p: Project, deviceId: string, except: string, seen: Set<string>): string[] {
  const ids = p.terminals.filter((x) => x.deviceId === deviceId && x.id !== except && !seen.has(x.id)).map((x) => x.id);
  ids.forEach((id) => seen.add(id));
  return ids;
}

const PASS_THROUGH = new Set(["switch", "busbar"]);

/**
 * The nearest protective device between a consumer and its source, found by walking wires away from the consumer
 * and through switches and busbars. The first one reached wins; undefined if the path has none.
 */
export function protectiveUpstream(p: Project, from: string): Device | undefined {
  const seen = new Set<string>([from]);
  let frontier = [from];
  while (frontier.length) {
    const next: string[] = [];
    for (const t of frontier) {
      for (const n of neighbours(p, t)) {
        if (seen.has(n.terminal)) continue;
        seen.add(n.terminal);
        const d = deviceOfTerminal(p, n.terminal);
        const def = d && getComponent(d.kind);
        if (!d || !def) continue;
        if (def.protective) return d;
        if (PASS_THROUGH.has(def.category)) next.push(n.terminal, ...otherTerminals(p, d.id, n.terminal, seen));
      }
    }
    frontier = next;
  }
  return undefined;
}

/** The wire attached directly to a terminal, if exactly one is. */
export const feedWire = (p: Project, terminalId: string): string | undefined => {
  const n = neighbours(p, terminalId);
  return n.length === 1 ? n[0]!.wireId : undefined;
};
