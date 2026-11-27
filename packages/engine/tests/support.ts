import { getComponent, paramValid, stateValid, terminalsFor } from "@flow/catalog";
import {
  applyCommand,
  createProject,
  newId,
  type ApplyContext,
  type Command,
  type CommandPayloads,
  type CommandType,
  type Project,
} from "@flow/model";

export interface BuildSpec {
  devices: Array<{
    name: string;
    kind: string;
    params?: Record<string, number | string>;
    state?: "closed" | "open" | "grounded";
  }>;
  wires: Array<{
    from: string;
    to: string;
    lengthM: number;
    section: number;
    role?: string;
    material?: "Cu" | "Al";
    insulation?: "PVC" | "XLPE";
    installation?: string;
  }>;
}

let n = 0;
const ctx: ApplyContext = {
  newId: () => newId({ now: () => 1_700_000_000_000 + n, random: () => ((n++ * 7919) % 1009) / 1009 }),
  now: () => "2026-11-27T00:00:00Z",
  terminalsFor,
  paramValid,
  stateValid,
};
const cmd = <T extends CommandType>(type: T, payload: CommandPayloads[T]): Command<T> => ({
  id: ctx.newId(),
  type,
  v: 1,
  at: ctx.now(),
  by: "local",
  payload,
});

function run(p: Project, c: Command): Project {
  const r = applyCommand(p, c, ctx);
  if (!r.ok) throw new Error(`${c.type}: ${r.diagnostic.code}`);
  return r.project;
}

export interface Built {
  project: Project;
  deviceIds: Map<string, string>;
  terminal: (ref: string) => string;
}

/** Builds a project from a compact spec: "Name.role" references address a terminal. */
export function build(spec: BuildSpec): Built {
  let p = createProject("case", "en", { id: "il", edition: "2026" });
  const ids = new Map<string, string>();
  for (const d of spec.devices) {
    if (!getComponent(d.kind)) throw new Error(`unknown kind ${d.kind}`);
    p = run(p, cmd("device.add", { kind: d.kind, name: d.name, params: d.params ?? {} }));
    const id = p.devices.at(-1)!.id;
    ids.set(d.name, id);
    if (d.state) p = run(p, cmd("device.setState", { deviceId: id, state: d.state }));
  }
  const terminal = (ref: string): string => {
    const [name, role] = ref.split(".") as [string, string];
    const t = p.terminals.find((x) => x.deviceId === ids.get(name) && x.role === role);
    if (!t) throw new Error(`no terminal ${ref}`);
    return t.id;
  };
  for (const w of spec.wires) {
    const conductor = {
      role: (w.role ?? "L1") as "L1",
      sectionMm2: w.section,
      material: w.material ?? "Cu",
      insulation: w.insulation ?? "PVC",
    };
    p = run(
      p,
      cmd("wire.add", {
        cable: { lengthM: w.lengthM, installation: w.installation ?? "C", conductors: [conductor] },
        from: { terminalId: terminal(w.from) },
        to: { terminalId: terminal(w.to) },
      }),
    );
  }
  return { project: p, deviceIds: ids, terminal };
}
