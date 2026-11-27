import { getComponent } from "@flow/catalog";
import { nodeKey, type Device, type Project } from "@flow/model";
import { solve } from "./solve";

export type StepAction =
  "open" | "lock" | "verify_dead" | "earth" | "unearth" | "unlock" | "close" | "verify_earth_open";
export interface Step {
  n: number;
  action: StepAction;
  deviceId?: string;
}
export type ViolationCode = "open_under_load" | "earth_on_live" | "still_live" | "no_isolation_point";
export interface Violation {
  code: ViolationCode;
  step?: number;
  deviceIds: string[];
}

export interface SwitchingPlan {
  /** Steps to make the target safe to work on */
  isolate: Step[];
  /** Steps to put it back, in reverse order */
  restore: Step[];
  violations: Violation[];
  /** The switches that bound the target region, and the earthing points inside it */
  boundary: string[];
  earthing: string[];
}

const category = (d: Device | undefined): string | undefined => (d ? getComponent(d.kind)?.category : undefined);

interface Region {
  terminals: Set<string>;
  boundary: Set<string>;
  earthing: Set<string>;
}

/** Everything joined to the targets by wires and non-switching devices; switches end the region and become its boundary. */
function regionOf(p: Project, targetIds: string[]): Region {
  const byId = new Map(p.devices.map((d) => [d.id, d]));
  const terminals = new Set<string>();
  const boundary = new Set<string>();
  const earthing = new Set<string>();
  const queue: string[] = p.terminals.filter((t) => targetIds.includes(t.deviceId)).map((t) => t.id);
  queue.forEach((t) => terminals.add(t));
  const visit = (id: string): void => {
    if (terminals.has(id)) return;
    terminals.add(id);
    queue.push(id);
  };
  for (let k = 0; k < queue.length; k++) {
    const t = p.terminals.find((x) => x.id === queue[k]);
    const dev = t && byId.get(t.deviceId);
    if (!t || !dev) continue;
    if (category(dev) === "switch" && !targetIds.includes(dev.id)) {
      boundary.add(dev.id);
      continue;
    }
    if (category(dev) === "earthing") earthing.add(dev.id);
    for (const o of p.terminals.filter((x) => x.deviceId === dev.id)) visit(o.id);
    for (const w of p.wires) {
      const a = nodeKey(p, w.from);
      const b = nodeKey(p, w.to);
      if (a === t.id) visit(b);
      else if (b === t.id) visit(a);
    }
  }
  return { terminals, boundary, earthing };
}

const withState = (p: Project, id: string, state: Device["state"]): Project => ({
  ...p,
  devices: p.devices.map((d) => (d.id === id ? { ...d, state } : d)),
});

function currentThrough(p: Project, deviceId: string, profile: "il" | "iec"): number {
  const r = solve(p, { profile });
  const mine = new Set(p.terminals.filter((t) => t.deviceId === deviceId).map((t) => t.id));
  const wires = p.wires.filter((w) => mine.has(nodeKey(p, w.from)) || mine.has(nodeKey(p, w.to))).map((w) => w.id);
  return Math.max(0, ...r.branches.filter((b) => wires.includes(b.id)).map((b) => b.current.value));
}

function regionLive(p: Project, region: Region, profile: "il" | "iec"): boolean {
  const r = solve(p, { profile });
  return r.nodes.some((n) => n.terminals.some((t) => region.terminals.has(t)) && n.voltage.value > 1);
}

const breaksLoad = (p: Project, id: string): boolean => {
  const d = p.devices.find((x) => x.id === id);
  return !!d && !!getComponent(d.kind)?.breaksLoad;
};

type Push = (action: StepAction, deviceId?: string) => number;
const stepper =
  (list: Step[]): Push =>
  (action, deviceId) =>
    list.push({ n: list.length + 1, action, ...(deviceId ? { deviceId } : {}) });

function isolationSteps(
  project: Project,
  region: Region,
  open: string[],
  earthing: string[],
  targets: string[],
  profile: "il" | "iec",
) {
  const steps: Step[] = [];
  const violations: Violation[] = [];
  const push = stepper(steps);
  let state = project;
  for (const id of open) {
    const n = push("open", id);
    if (!breaksLoad(project, id) && currentThrough(state, id, profile) > 0.5)
      violations.push({ code: "open_under_load", step: n, deviceIds: [id] });
    state = withState(state, id, "open");
  }
  for (const id of open) push("lock", id);
  const verify = push("verify_dead");
  if (regionLive(state, region, profile)) violations.push({ code: "still_live", step: verify, deviceIds: targets });
  if (!earthing.length) violations.push({ code: "no_isolation_point", deviceIds: targets });
  for (const id of earthing) {
    const n = push("earth", id);
    if (regionLive(state, region, profile)) violations.push({ code: "earth_on_live", step: n, deviceIds: [id] });
    state = withState(state, id, "grounded");
  }
  return { steps, violations };
}

function restoreSteps(open: string[], earthing: string[]): Step[] {
  const steps: Step[] = [];
  const push = stepper(steps);
  for (const id of [...earthing].reverse()) push("unearth", id);
  if (earthing.length) push("verify_earth_open");
  for (const id of [...open].reverse()) push("unlock", id);
  for (const id of [...open].reverse()) push("close", id);
  return steps;
}

/**
 * Isolation plan for working on the target devices: open the load-breaking switches first, then the isolators,
 * lock them, prove the region is dead, then close the earthing points. Each step is checked by solving the network.
 */
export function switchingPlan(project: Project, targetIds: string[], profile: "il" | "iec" = "il"): SwitchingPlan {
  const region = regionOf(project, targetIds);
  const open = [...region.boundary]
    .filter((id) => project.devices.find((d) => d.id === id)?.state !== "open")
    .sort((a, b) => Number(breaksLoad(project, b)) - Number(breaksLoad(project, a)));
  const earthing = [...region.earthing];
  const { steps, violations } = isolationSteps(project, region, open, earthing, targetIds, profile);
  return {
    isolate: steps,
    restore: restoreSteps(open, earthing),
    violations,
    boundary: [...region.boundary],
    earthing,
  };
}
