import type { Diagnostic } from "@flow/model";
import type { Traced } from "./trace";

export interface NodeResult {
  key: string;
  terminals: string[];
  baseVoltage: Traced;
  voltage: Traced;
  voltagePu: Traced;
  angle: Traced;
}
export interface BranchResult {
  id: string;
  kind: "wire" | "transformer";
  current: Traced;
  loss: Traced;
}
export interface LoadResult {
  deviceId: string;
  voltage: Traced;
  dropPercent: Traced;
  activePower: Traced;
  reactivePower: Traced;
  status: "ok" | "undervoltage";
}
export interface SourceResult {
  deviceId: string;
  activePower: Traced;
  reactivePower: Traced;
}
export interface LoopResult {
  regulatorId: string;
  current: Traced;
  voltage: Traced;
  power: Traced;
  maxVoltage: Traced;
}
export interface FaultResult {
  nodeKey: string;
  terminals: string[];
  ik3Max: Traced;
  ik3Min: Traced;
  ik2Min: Traced;
  ipMax: Traced;
  ithMax: Traced;
  rxRatio: Traced;
}
export interface CableCheck {
  cableId: string;
  wireId: string;
  ib: Traced;
  iz?: Traced;
  in?: Traced;
  i2?: Traced;
  requiredSection?: Traced;
  passes: { current: boolean; capacity: boolean; i2: boolean; thermal: boolean } | undefined;
}
export interface IslandResult {
  id: string;
  system: string;
  method: string;
  iterations: Traced;
  converged: boolean;
}

export interface Results {
  profile: string;
  islands: IslandResult[];
  nodes: NodeResult[];
  branches: BranchResult[];
  loads: LoadResult[];
  sources: SourceResult[];
  loops: LoopResult[];
  faults: FaultResult[];
  cableChecks: CableCheck[];
  diagnostics: Diagnostic[];
}

export const emptyResults = (profile: string, diagnostics: Diagnostic[] = []): Results => ({
  profile,
  islands: [],
  nodes: [],
  branches: [],
  loads: [],
  sources: [],
  loops: [],
  faults: [],
  cableChecks: [],
  diagnostics,
});
