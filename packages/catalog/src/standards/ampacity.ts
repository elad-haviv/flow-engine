import type { Insulation, Material } from "./conductors";
import { SECTIONS_MM2 } from "./conductors";
import type { StandardTable } from "./table";

/** Current-carrying capacity in amperes by section, listed in SECTIONS_MM2 order. */
export interface AmpacityRow {
  method: string;
  material: Material;
  insulation: Insulation;
  loaded: 2 | 3;
  amps: number[];
}

const rows: AmpacityRow[] = [
  {
    method: "C",
    material: "Cu",
    insulation: "PVC",
    loaded: 3,
    amps: [18, 25, 34, 43, 60, 80, 101, 126, 153, 196, 238, 276, 319, 364, 430],
  },
  {
    method: "C",
    material: "Cu",
    insulation: "XLPE",
    loaded: 3,
    amps: [23, 31, 42, 54, 75, 100, 127, 158, 192, 246, 298, 346, 395, 450, 538],
  },
  {
    method: "C",
    material: "Cu",
    insulation: "PVC",
    loaded: 2,
    amps: [20, 27, 37, 47, 65, 87, 114, 141, 182, 234, 284, 330, 381, 436, 515],
  },
  {
    method: "C",
    material: "Cu",
    insulation: "XLPE",
    loaded: 2,
    amps: [24, 33, 45, 58, 80, 107, 138, 171, 209, 269, 328, 382, 441, 506, 599],
  },
];

export const ampacity: StandardTable<AmpacityRow[]> = {
  id: "ampacity",
  source: "IEC 60364-5-52, entered from the drafter's recollection of the published reference-method values",
  edition: "latest at entry",
  clause: "Table B.52 series, reference method C (clipped direct), copper only",
  dateTaken: "2026-11-27",
  verified: false,
  rows,
};

/** Ampacity for a section, or undefined when the table has no such row or the section is not listed. */
export function lookupAmpacity(
  method: string,
  material: Material,
  insulation: Insulation,
  loaded: 2 | 3,
  sectionMm2: number,
): number | undefined {
  const row = rows.find(
    (r) => r.method === method && r.material === material && r.insulation === insulation && r.loaded === loaded,
  );
  const idx = (SECTIONS_MM2 as readonly number[]).indexOf(sectionMm2);
  return row && idx >= 0 ? row.amps[idx] : undefined;
}
