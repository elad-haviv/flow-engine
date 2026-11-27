import { conductors, type Insulation, type Material } from "@flow/catalog";
import type { PowerSystem } from "@flow/catalog";
import type { Cable } from "@flow/model";
import { C, type Complex } from "./numeric/complex";

export type TempMode = "operating" | "scMax" | "scMin";
const PHASE_ROLES = ["L1", "L", "DC+"];

export interface WireImpedance {
  z: Complex;
  r: number;
  sectionMm2: number;
  material: Material;
  insulation: Insulation;
  thetaC: number;
  lengthM: number;
}

export function phaseConductor(cable: Cable) {
  return (
    cable.conductors.find((c) => PHASE_ROLES.includes(c.role)) ??
    cable.conductors.find((c) => c.role === "L2" || c.role === "L3")
  );
}

const theta = (mode: TempMode, ins: Insulation): number =>
  mode === "scMax" ? 20 : mode === "scMin" ? 80 : (conductors.rows.maxOperatingTemp[ins] ?? 20);

/** Loop impedance in ohms for the phase-equivalent model: one conductor for three-phase, out and back for single-phase and DC. */
export function wireImpedance(cable: Cable, system: PowerSystem, mode: TempMode): WireImpedance | undefined {
  const c = phaseConductor(cable);
  if (!c) return undefined;
  const d = conductors.rows;
  const th = theta(mode, c.insulation);
  const r1 = (d.resistivity20[c.material] / c.sectionMm2) * cable.lengthM * (1 + d.tempCoeff[c.material] * (th - 20));
  const x1 = system === "dc" ? 0 : d.reactancePerM * cable.lengthM;
  const k = system === "ac3" || system === "loop" ? 1 : 2;
  return {
    z: C(r1 * k, x1 * k),
    r: r1 * k,
    sectionMm2: c.sectionMm2,
    material: c.material,
    insulation: c.insulation,
    thetaC: th,
    lengthM: cable.lengthM,
  };
}
