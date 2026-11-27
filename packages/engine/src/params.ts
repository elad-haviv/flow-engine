import { getComponent, type ComponentDef, type TerminalRole } from "@flow/catalog";
import { diagnostic, type Device, type Diagnostic, type Project } from "@flow/model";
import { ENGINE_CODES } from "./codes";

export interface Dev {
  device: Device;
  def: ComponentDef;
  p: Record<string, number | string>;
  defaulted: string[];
  term: Partial<Record<TerminalRole, string>>;
}

const val = (v: unknown): number | string | undefined =>
  typeof v === "number" || typeof v === "string"
    ? v
    : typeof v === "object" && v !== null && "v" in v
      ? (v as { v: number }).v
      : undefined;

/** Reads every device with its catalog definition. Missing required parameters are errors; defaults are listed, never silent. */
export function readDevices(project: Project, diags: Diagnostic[]): Dev[] | undefined {
  const out: Dev[] = [];
  let bad = false;
  for (const device of project.devices) {
    const def = getComponent(device.kind);
    if (!def) {
      diags.push(diagnostic(ENGINE_CODES.kindUnknown, "error", [device.id], { kind: device.kind }));
      bad = true;
      continue;
    }
    const p: Dev["p"] = {};
    const defaulted: string[] = [];
    for (const spec of def.params) {
      const v = val(device.params[spec.name]);
      if (v !== undefined) p[spec.name] = v;
      else if (spec.required) {
        diags.push(
          diagnostic(ENGINE_CODES.paramMissing, "error", [device.id], { param: spec.name, kind: device.kind }),
        );
        bad = true;
      } else if (spec.default !== undefined) {
        p[spec.name] = spec.default;
        defaulted.push(spec.name);
      }
    }
    if (defaulted.length)
      diags.push(diagnostic(ENGINE_CODES.paramDefaulted, "info", [device.id], { params: defaulted.join(", ") }));
    const term: Dev["term"] = {};
    for (const t of project.terminals.filter((x) => x.deviceId === device.id))
      if (!(t.role in term)) term[t.role] = t.id;
    out.push({ device, def, p, defaulted, term });
  }
  return bad ? undefined : out;
}

export const num = (d: Dev, name: string): number => d.p[name] as number;
