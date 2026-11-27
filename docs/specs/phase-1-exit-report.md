# Phase 1 exit report

* **Date:** 2026-11-27
* **Status:** Implementation complete. Gates 2 and 3 need the owner; Phase 1 is not complete until they are met.

## Exit gates

| Gate | Result |
| --- | --- |
| 1. Tests pass; branch coverage of `engine` and `catalog` at least 85 percent | Pass: `pnpm verify` runs 141 tests; branch coverage is enforced per package in `vitest.config.ts` (engine 89 percent) |
| 2. Every reference case in the minimum set is signed off by the owner | **Open.** 20 cases exist, covering the minimum set; none is signed off. Each has its hand calculation, computed independently of the engine |
| 3. The owner has checked every formula and table | **Open.** [verification/phase-1-checklist.md](../verification/phase-1-checklist.md) lists every item with its code location |
| 4. A 500-device sample solves in under one second | Pass: 423 devices and 412 nodes solve in about 75 ms on this machine (`performance.test.ts`, asserted under 1 s) |
| 5. No `any`, no forbidden import, no marker without an issue number | Pass (lint, depcheck, marker check) |

## What exists

Numeric core (complex numbers, dense LU); power flow (backward/forward sweep for trees, Newton-Raphson for meshes); islands by power system with converter boundaries; AC three-phase, AC single-phase, DC and the series constant-current loop; short circuit (three-phase and phase-to-phase); voltage drop; cable checks; breaking-capacity check; busbar advice; traces on every result number; 19 catalog components; standards tables marked unverified; 20 reference cases.

Blue Grid parity rows for Phase 1 are handled as follows: the 63 rows listed in the spec map onto the engine, the catalog and the diagnostics. The UI rows among them (panels, dialogs) wait for Phase 2.

## Deviations from the spec

* **Boundary iteration.** Full steps first, damping 0.5 only when the change stops shrinking; tolerance 1e-6 relative plus 1 mW, cap 20. With damping fixed at 0.5 the spec's tolerance would have needed more than 20 passes for a simple chain.
* **Newton tolerance** is 1e-8 pu (the spec said 1e-6).
* **Nominal voltage.** Nodes joined by wires share one nominal voltage; explicit voltages within 10 percent are treated as the same network (a 48 V and a 50 V DC source on one bus). Beyond that it is a "transformer missing" error.
* **Near-generator faults** (open item 4): a warning on every network that contains a generator; no near-generator calculation. Motor and converter contributions to fault current are not included (reported as info).
* **Terminal role `return`** was added to the model for the regulator's loop return.
* **Catalog carries behaviour** (demand, supply, source impedance, series impedance), so the engine never compares device kinds.
* **Short-circuit speed.** Leaf nodes are peeled before the matrix inverse; results are identical.
* **Ampacity** covers copper, reference method C only. Other methods and aluminium report "no table" instead of guessing.
* **Generator as source.** A generator is the slack only when the network has no grid, battery, solar array or converter output; otherwise it injects its set power.
* **Slack power split.** If two sources share one node, the first gets the whole slack power.

## Not done

Real Israeli tables (the owner has to name the source, open item 3); neutral and per-phase results and the earth-fault loop (Phase 4, by decision); protection time-current curves (Phase 4).

## Open items for the owner

1. Check the formulas and tables (checklist) and sign off or correct the reference cases.
2. Name the source and values for the Israeli voltage-drop limit and ampacity tables.
3. Confirm the c-factor tolerance for Israeli low-voltage networks (6 or 10 percent).
4. Decide whether near-generator faults need a real calculation before release.
