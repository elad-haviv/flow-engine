import type { StandardTable } from "./table";

export type Material = "Cu" | "Al";
export type Insulation = "PVC" | "XLPE" | "none";

export interface ConductorData {
  /** Resistivity at 20 degrees C in ohm mm2 per m */
  resistivity20: Record<Material, number>;
  /** Temperature coefficient of resistance per kelvin */
  tempCoeff: Record<Material, number>;
  /** Typical reactance of a low-voltage cable in ohm per m (assumption until a cable catalog exists) */
  reactancePerM: number;
  /** Thermal withstand factor k (A s^0.5 per mm2), IEC 60364-4-43 */
  k: Record<Material, Partial<Record<Insulation, number>>>;
  /** Maximum conductor temperature in normal operation, degrees C */
  maxOperatingTemp: Partial<Record<Insulation, number>>;
}

export const conductors: StandardTable<ConductorData> = {
  id: "conductors",
  source: "IEC 60228 (resistivity), IEC 60364-4-43 (k values), IEC 60287 (operating temperature)",
  edition: "latest at entry",
  clause: "IEC 60364-4-43 table 43A; IEC 60909 for the temperature of resistance",
  dateTaken: "2026-11-27",
  verified: false,
  rows: {
    resistivity20: { Cu: 0.017241, Al: 0.028264 },
    tempCoeff: { Cu: 0.00393, Al: 0.00403 },
    reactancePerM: 0.00008,
    k: { Cu: { PVC: 115, XLPE: 143 }, Al: { PVC: 76, XLPE: 94 } },
    maxOperatingTemp: { PVC: 70, XLPE: 90 },
  },
};

export const SECTIONS_MM2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240] as const;
