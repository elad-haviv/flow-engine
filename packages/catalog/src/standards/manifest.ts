export interface StandardEntry {
  profile: "il" | "iec";
  standard: string;
  edition: string;
  clauseSet: string;
  dateTaken: string;
}

/** Standards used by version 1. Tables arrive in Phase 1. The latest edition is taken when each table is entered. */
export const manifest: StandardEntry[] = [
  {
    profile: "il",
    standard: "Israeli Electricity Law regulations (installations)",
    edition: "latest at entry",
    clauseSet: "to be fixed with Phase 1 tables",
    dateTaken: "2026-11-27",
  },
  {
    profile: "iec",
    standard: "IEC 60909 (short circuit)",
    edition: "latest at entry",
    clauseSet: "to be fixed with Phase 1 tables",
    dateTaken: "2026-11-27",
  },
  {
    profile: "iec",
    standard: "IEC 60364 (installations)",
    edition: "latest at entry",
    clauseSet: "to be fixed with Phase 1 tables",
    dateTaken: "2026-11-27",
  },
];
