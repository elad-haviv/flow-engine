# Phase 1 spec: the calculation engine

* **Author:** Elad Haviv (owner), drafted with Claude Code
* **Status:** Draft for owner review. **Every formula and number here is the drafter's understanding of the standards and must be verified by the owner (an electrical engineer) before it is implemented.** Section "Verification" says how.
* **Date:** 2026-11-27
* **Depends on:** [Phase 0](./phase-0-foundations.md). **Design:** [flow-engine.md](../designs/flow-engine.md).

## Purpose

Phase 1 delivers a headless engine: a function from a project model to results, calculation traces and diagnostics, with no screen. It is checked against reference cases that the owner signs off, before any editor exists.

## Scope

**In:** the numeric core; derived nets; per-power-type solvers (AC three-phase, AC single-phase, DC, series constant-current loop) with converter boundaries; steady-state load flow; voltage drop; short-circuit current for three-phase and phase-to-phase faults; cable sizing; protection checks; standards tables for the Israeli profile and the IEC profile; the components needed for the core library; advice rules; traces; the reference-case format.

**Out (moved to Phase 4 at the 2026-11-27 design review):** neutral current, per-phase results, the earth-fault loop, phase-to-earth short circuit, discrimination and time-current curves, arc flash, harmonics, transients. The engine's result type reserves no field for them.

## Parity rows in scope

| Row | Feature | Decision |
| --- | --- | --- |
| UI-044 | Sim panel: live electrical data | REDESIGN |
| UI-047 | Sim panel: loss and voltage-drop analysis | REDESIGN |
| UI-049 | Sim panel: cumulative voltage-drop section | MERGE |
| UI-064 | Settings: simulation and calculation | REDESIGN |
| ED-081 | Settings dialog (accessibility and simulation tabs) | REDESIGN |
| CH-011 | Cable and Protection Calculator (31 Israeli installation methods, A-G reference, PVC/XLPE, temperature, grouping, parallel cables) | REDESIGN |
| CH-043 | LOTO (lock-out/tag-out) blocks operation | KEEP |
| CH-045 | No opening of disconnector under load: ARC fault | KEEP |
| CH-046 | Earth switch three positions, grounds bottom port only | MERGE |
| CH-047 | Tripped devices reset only to open; RCD reset by click | KEEP |
| CH-053 | Load flow: voltages, currents, power (P, Q, S), power factor display | REDESIGN |
| CH-054 | Voltage drop (local, cumulative, % vs local nominal) | REDESIGN |
| CH-055 | Cumulative power losses | REDESIGN |
| CH-058 | Impedance-aware load sharing on meshes and parallel paths (admittance) | REDESIGN |
| CH-059 | Iterative power-flow, mesh (Gauss-Seidel) solver, solver selector | REDESIGN |
| CH-061 | Reactive power and impedance chain (R/X, transformer %Z, source MVA) | REDESIGN |
| CH-062 | IEC 60909 style fault currents (Ik max, Ik min, c factors, temperature correction) | REDESIGN |
| CH-064 | Protection trip logic (overcurrent, fuse blow, over/under-voltage, source overload) | REDESIGN |
| CH-065 | "Enable protections" toggle (also in simple mode) | REDESIGN |
| CH-066 | Faults on cables generate short-circuit current | REDESIGN |
| CH-072 | Island decomposition and signature-gated re-solve | REDESIGN |
| CH-073 | Engine in a Web Worker with fallback | KEEP |
| CH-076 | Mixed AC 3-ph, AC 1-ph, DC with colours (DC blue) | REDESIGN |
| CH-078 | Input and output power/current shown separately for converters and transformers | KEEP |
| CH-079 | Transformer (ratio, vector group, %Z, losses, phase shift) | REDESIGN |
| CH-080 | Grid with short-circuit MVA | KEEP |
| CH-081 | Generator with fuel, drift, sync | KEEP |
| CH-090 | Busbar (variable width/ports), combiner box, pole, SPD, connector (wireless address) | REDESIGN |
| COMP-001 | GRID | KEEP |
| COMP-002 | GEN (generator) | KEEP |
| COMP-005 | TRANSFORMER | REDESIGN |
| COMP-012 | LOAD | KEEP |
| COMP-013 | CURRENT_LOAD | MERGE |
| COMP-017 | BREAKER | MERGE |
| COMP-018 | LOAD_BREAKER | MERGE |
| COMP-019 | DISCONNECTOR | MERGE |
| COMP-020 | EARTH_SWITCH | MERGE |
| COMP-024 | BUSBAR | REDESIGN |
| SIM-001 | Energisation by BFS from sources | REDESIGN |
| SIM-002 | Source set and gating | KEEP |
| SIM-003 | Open, tripped, blown and grounded devices stop propagation | KEEP |
| SIM-004 | Source collision / paralleling check | KEEP |
| SIM-005 | Dead-island pruning | KEEP |
| SIM-006 | Island decomposition and result cache | REDESIGN |
| SIM-007 | Load aggregation upstream | REDESIGN |
| SIM-009 | Voltage drop and losses | REDESIGN |
| SIM-010 | Fault current (IEC 60909) | REDESIGN |
| SIM-011 | Applied fault (component or wire) | REDESIGN |
| SIM-012 | Breaker overcurrent trip | KEEP |
| SIM-015 | Voltage limit errors | KEEP |
| SIM-016 | Source and capacity overload | KEEP |
| SIM-017 | Tripped and blown status text | KEEP |
| SIM-020 | Radial and mesh solvers | REDESIGN |
| SIM-021 | Solver choice, cadence and worker settings | REDESIGN |
| SIM-022 | Worker coalescing protocol | KEEP |
| SIM-023 | Calculation display options | REDESIGN |
| SIM-024 | Manual switching rules | KEEP |
| SIM-025 | Lock-out / tag-out | KEEP |
| SIM-027 | Arc on opening a disconnector under load | KEEP |
| SIM-028 | Earth switch 3-position cycle | KEEP |
| SIM-038 | Trip effects | REDESIGN |
| SIM-039 | Alert categories | REDESIGN |
| SIM-040 | Network error and overload alerts | KEEP |


## Decisions fixed by this spec

| Decision | Value | Origin |
| --- | --- | --- |
| Result type | One `Results` object: per-node voltage, per-branch current and loss, per-fault current, per-load status, diagnostics, traces | Claude's proposal |
| Entry point | `solve(project: Project, options: SolveOptions): Results`. Pure, synchronous, no clock, no random, no DOM. A worker wrapper comes in Phase 2 | Claude's proposal |
| Numeric core | In-house complex numbers and dense LU with partial pivoting; sparse only if a measured case needs it | Owner (design) |
| Standards | Israeli law first, IEC second, latest table edition taken when each table is entered (date recorded) | Owner |
| Out of scope for results | Neutral, per-phase, earth loop (Phase 4) | Owner (2026-11-27) |
| Default silence | No silent defaults: any assumed value yields an `info` diagnostic and `assumed: true` in the trace | Owner (goal) |

## Pipeline

1. **Validate.** Run the model invariants. Errors stop here and are returned as diagnostics.
2. **Derive nets.** Union-find over terminals joined by wires and junctions. A switch in the open state splits its nets. The net list is not stored.
3. **Classify islands.** Each connected island gets a power type from its sources and loads. Mixed types in one island are an error `engine.island.mixed_power_type` unless separated by a converter (rectifier, inverter, regulator, transformer).
4. **Solve each island** with its solver (below).
5. **Converter boundaries.** Converters couple islands. Iterate boundary quantities until the largest change is below 1e-4 pu or 20 iterations, with damping 0.5. If not converged: `engine.boundary.not_converged` (error) with the last values.
6. **Derived checks:** voltage drop, short circuit, cable sizing, protection.
7. **Advice rules** produce `info` and `warning` diagnostics (for example busbar suggestion at 3 or more wires on one terminal).
8. **Assemble** results and traces.

## Solvers (proposals, owner decides numerics)

All AC work is steady-state phasor in per-unit on a chosen base, with a balanced three-phase model for the three-phase solver. Single-phase uses the single-phase equivalent. DC and series loops use real arithmetic.

| Solver | Method | Notes |
| --- | --- | --- |
| AC three-phase, radial | Backward/forward sweep | Used when the island is a tree |
| AC three-phase, meshed | Newton-Raphson on bus voltages, flat start | Used when the island has a loop. Converges in at most 30 iterations, tolerance 1e-6 pu, else `engine.loadflow.not_converged` |
| AC single-phase | As above on the single-phase equivalent | The line-to-neutral loop is not modelled in Phase 1 |
| DC | Nodal analysis, dense LU | Resistive network with constant-power and constant-voltage sources |
| Series constant-current loop | Series sum of voltage drops at the set current | The regulator holds the current. An open loop gives `engine.loop.open` |

A floating island (no source) is reported as `engine.island.no_source` (warning) and gets zero results.

## Short circuit (IEC 60909, three-phase and phase-to-phase only)

All inputs come from the model and the standards tables. **Verify every line.**

| Quantity | Formula |
| --- | --- |
| Voltage factor c | Low voltage: c max 1.05 (tolerance 6 percent) or 1.10 (tolerance 10 percent); c min 0.95. Medium voltage: c max 1.10, c min 1.00 |
| Network feeder impedance | Z_Q = c · U² / S''kQ; X_Q = 0.995 · Z_Q; R_Q = 0.1 · X_Q |
| Transformer impedance | Z_T = u_k · U_r² / S_r with R_T from the copper loss; correction K_T = 0.95 · c_max / (1 + 0.6 · x_T) |
| Cable impedance | From the conductor table: R at the stated temperature, X from the catalog or standard |
| Initial symmetrical current | I''k3 = c · U_n / (√3 · \|Z_k\|) |
| Peak current | i_p = κ · √2 · I''k3, with κ = 1.02 + 0.98 · e^(−3R/X) |
| Phase-to-phase | I''k2 = (√3/2) · I''k3 (when Z1 = Z2) |
| Breaking and thermal values | I_b and I_th per the standard's simplified method, in Phase 1 for far-from-generator faults only. Near-generator is a warning |

A hand check to put in the reference cases: a 1000 kVA, 6 percent transformer on a 250 MVA source gives a three-phase current of about 24 kA on the 400 V side. The owner computes the exact value and records it as case `SC-001`.

## Voltage drop

Three-phase: ΔU = √3 · I · L · (R cosφ + X sinφ). Single-phase: ΔU = 2 · I · L · (R cosφ + X sinφ). DC: ΔU = 2 · I · R · L. R and X per metre come from the conductor table at the operating temperature recorded in the trace. Limits come from the profile (Israeli law first).

## Cable sizing

A conductor passes when `Ib ≤ In ≤ Iz`, `I2 ≤ 1.45 · Iz`, the thermal withstand `S ≥ I · √t / k` for the fault from the short-circuit result, and the voltage drop is within the profile limit. Iz comes from the profile's ampacity table with the installation method, temperature, grouping and the conductor material applied as correction factors. Each factor appears in the trace with its table and clause.

## Standards data

Tables live in `packages/catalog/src/standards/`, one file per table, each with `{ source, edition, clause, dateTaken, rows }`. A table row has no code logic. The tests check that each table has a source, edition and date, values are within physical ranges, and monotonic where the physics says so (for example ampacity grows with section).

## Diagnostics and traces

* Codes follow the Phase 0 rule `area.entity.problem`. Phase 1 adds the `engine.*` and `advice.*` families.
* A trace entry is `{ quantity, formula, inputs: [{ name, value, unit, origin }], standardClause, assumed }`. Inputs carry the Phase 0 field `origin`.
* Every number in the results has a trace entry. A test walks the results and fails on any number without one.

## Components (core library, about 20)

Grid, generator, breaker, busbar, transformer, disconnector, earthing disconnector, load first, as the owner named; then fuse, contactor, cable, motor, capacitor, rectifier, inverter, battery, solar array, constant-current regulator, series lamp load and meter. Each is one catalog entry: parameter schema, terminals, default symbol, and a behaviour function. No `if (kind === ...)` outside the catalog (a lint rule). Parity rows for components live in [components-and-simulation.md](../parity/components-and-simulation.md).

## Reference cases

Format: one JSON file per case in `tests/reference/`, `{ id, title, profile, project, expected: { quantity, value, unit, tolerance }[], source, signedOffBy, signedOffOn }`. A case without `signedOffBy` is a draft and does not count toward the exit gate. Sources: hand calculation shown in the file, or a worked example in the cited standard or textbook. Blue Grid outputs are not a source (the known transformer impedance error would carry over).

Minimum set for the exit gate: radial three-phase load flow; meshed three-phase; single-phase; DC with two sources; series loop; each converter type; short circuit at three voltage levels; cable sizing pass and each failure mode; open and closed switch; floating island.

## Files

`packages/engine/src/`: `index.ts`, `solve.ts`, `nets.ts`, `islands.ts`, `boundary.ts`, `numeric/{complex,lu,sweep,newton}.ts`, `solvers/{ac3,ac1,dc,loop}.ts`, `checks/{voltage-drop,short-circuit,cable-sizing,protection}.ts`, `advice/{busbar,rules}.ts`, `trace.ts`, `results.ts`. `packages/catalog/src/`: `components/*.ts` (one file each), `standards/*.ts`. `tests/reference/*.json` and `tests/reference.test.ts`.

## Tests

| Test | Assertions |
| --- | --- |
| `lu.test.ts`, `complex.test.ts` | Match known matrices and identities; random matrices (fast-check) satisfy A·x = b within 1e-9 |
| `nets.test.ts` | Union-find yields the expected nets; an open switch splits; promoting a junction changes nothing |
| `islands.test.ts` | Mixed power types are rejected, converters accepted, floating islands reported |
| `loadflow.test.ts` | Radial and meshed cases match reference cases within tolerance; sweep and Newton agree on a radial case |
| `boundary.test.ts` | Converges within the cap on reference cases; the non-convergent case reports the diagnostic |
| `short-circuit.test.ts` | Reference cases within 1 percent; c factor and κ branches each hit |
| `cable-sizing.test.ts` | Every pass and failure mode, each with its trace |
| `trace.test.ts` | No result number lacks a trace entry; no assumed value lacks a diagnostic |
| `determinism.test.ts` | Same project gives bit-identical results across 100 runs |
| `catalog.test.ts` | Every component has schema, terminals, symbol and behaviour; no kind comparison outside the catalog |

## Exit gates

1. All tests above pass and branch coverage of `engine` and `catalog` is at least 85 percent.
2. Every reference case in the minimum set is signed off by the owner.
3. The owner has checked every formula and standards table line in this spec and the code and recorded it in `docs/verification/signoff.md`.
4. A 500-device sample project solves in under 1 second on the CI machine (measured, recorded; a miss changes the plan, not the target).
5. No `any`, no forbidden import, no marker without an issue number.

## Verification

The owner checks, in order: the formulas above against the standards; each standards table against its source; each reference case's expected value by independent hand calculation. Anything the owner changes is changed here first, then in code.

## Open items for the owner

1. Confirm or change the solver choices (sweep and Newton, damping 0.5, tolerance 1e-4 pu, cap 20).
2. Confirm the c factor and tolerance choice for Israeli low-voltage networks.
3. Name the source for the Israeli ampacity and voltage-drop limits you want as the default.
4. Decide whether near-generator faults are a warning in Phase 1 or are implemented fully.
