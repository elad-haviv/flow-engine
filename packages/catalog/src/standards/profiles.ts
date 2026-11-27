import type { StandardTable } from "./table";

export interface Profile {
  id: "il" | "iec";
  /** Maximum voltage drop from the source to any load, percent */
  maxDropPercent: number;
  /** IEC 60909 voltage factor c */
  cFactors: { lvMax: number; lvMin: number; mvMax: number; mvMin: number };
  /** Voltage tolerance on low-voltage networks, percent, which selects c max */
  lvTolerancePercent: 6 | 10;
}

const c = (tol: 6 | 10) => ({ lvMax: tol === 6 ? 1.05 : 1.1, lvMin: 0.95, mvMax: 1.1, mvMin: 1.0 });

export const profiles: StandardTable<Record<Profile["id"], Profile>> = {
  id: "profiles",
  source:
    "IEC 60909-0 table 1 (c factors); voltage-drop limits are the drafter's assumption and need the owner's source",
  edition: "latest at entry",
  clause: "IEC 60909-0 section 3.3; IEC 60364-5-52 annex G for the drop limit",
  dateTaken: "2026-11-27",
  verified: false,
  rows: {
    il: { id: "il", maxDropPercent: 5, cFactors: c(6), lvTolerancePercent: 6 },
    iec: { id: "iec", maxDropPercent: 4, cFactors: c(10), lvTolerancePercent: 10 },
  },
};
