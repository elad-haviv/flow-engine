# Stage 9: Implementation Readiness Test

**Target:** `docs/designs/flow-engine.md`, DetailedRange lines 513-729 (plus Blue Grid current-state claims in lines 1-512 for the codebase reviewer). **Reviewers:** `egm-implementation-readiness` (standard: `implementation-readiness-standard`), `egm-codebase-details` (same standard), `egm-style`. All completed.

## Reviewer status

| Reviewer | Status |
| --- | --- |
| `egm-implementation-readiness` | completed |
| `egm-codebase-details` | completed |
| `egm-style` | completed |

## Implementation readiness findings

Verdict from the reviewer: **fail for Phases 0 and 1**. The file lists are complete and the tooling is mostly named. Behaviour, schemas, algorithms, tolerances and assertions are left to the implementer. The reviewer judged from the design text and did not open Blue Grid source.

| ID | Severity | Scope | Finding |
| --- | --- | --- | --- |
| IR1 | Blocker | Model validation vs layers | `schema/device.ts` checks parameters "against the kind's schema", and `load.ts` and `invariants.ts` validate. Kind schemas live in `catalog`, and `model` may import nothing. The implementer must choose between a validator injected at load, a loose schema in `model` with validation elsewhere, or moving the kind schema. This changes the public API. |
| IR2 | Blocker | Commands | No list of command types, payload shapes, `apply` preconditions, rejection diagnostics or version-numbering rule. Compensating commands are undefined per command, and Decision 3 left hand-written reverse versus patches unresolved in the plan. Compaction merge rules are missing. Snapshot and compaction triggers are not restated and no task measures them. |
| IR3 | Blocker | Entity schemas | No field names, types, optionality or enums for conductor roles, insulation, installation method, terminal roles, phase assignment, placement view ID, waypoints or language. Unspecified: where switch state lives, where an accepted "assumed" default is stored, and where unknown data is kept when load "never deletes" it. |
| IR4 | Blocker | Units | The internal unit system (SI, per-unit or other), the unit list, the quantity JSON shape, and the conversion tolerance are not given. |
| IR5 | Blocker | File format | No JSON layout, schema version number, snapshot and log placement, storage of the compaction "original", id, time and author sources, migration function signature, or ULID generation details (monotonic, library or hand-written, injection for tests). |
| IR6 | Blocker | Engine entry point | No file takes a project and produces results. Region order, islands, a source behind an open switch, and the load-flow inputs to short circuit, sizing and earth loop are undefined. `solve(region, boundaryValues)` leaves its shapes undefined. No result schema. Which results need traces is not enumerated, and nothing is displayed in Phase 1. |
| IR7 | Blocker | Solver algorithms | No sweep method, tolerance, iteration cap or initial guess for AC radial. No named method for AC mesh and no slack-bus behaviour. No load models (constant PQ, Z, I), generator behaviour, DC source formulae, converter tap, losses or angle shift. Boundary iteration has no tolerance, cap, exchange variables or update rule. No LU pivot strategy, conditioning threshold or floating-node criterion. The single-phase feed relationship is not given. |
| IR8 | Blocker | Short circuit | Missing c factors, KT/KG/KS, kappa and peak formula, breaking-current factors, and conductor temperature for the minimum case. Fault types disagree between sections, and Phase 1 fault locations are not stated. The capacity check does not say which current is compared with which rating or what margin applies. Zero-sequence data has no field list, vector-group mapping or typical-ratio source. The "incomplete" flag has no schema. |
| IR9 | Blocker | Sizing and earth loop | No sizing criteria or order, no size series, derating factors or ambient inputs. No earth-fault loop formula, earthing systems in scope, or disconnection-time limits. No simple device characteristic for the loop check in Phase 1, since protection curves are Phase 4. No voltage-drop formula or limits per profile. |
| IR10 | Blocker | Standards data | No value-plus-source tag shape, table file structure, manifest format, applicable Israeli regulation and clauses, or pinned IEC edition. The manifest is Phase 0 in the design and Phase 1 in the file list. Owner-entered tables are a human dependency with no instruction for an AI session before they exist. |
| IR11 | Blocker | Reference cases | The case format is deferred to a README that is itself part of the design. Tolerances exist only as proposals against pandapower. No named IEC or IEEE cases. Stock IEEE networks are unbalanced, which conflicts with the balanced solver. Pandapower has no single-phase or DC coverage and its version is not pinned. `transformer-sides.json` has no values. No mapping exists for Blue Grid's test numbers. |
| IR12 | Blocker | Custom lint rules | "String literals in user-facing code" and "device-kind comparisons outside catalog" are not stock ESLint rules. No plugin file is listed, and user-facing code, kind comparison detection and the complexity threshold are undefined. |
| IR13 | Major | Tool configuration | Exact Node, pnpm and tool versions, package scope and names, build tool and module format, exports map, `jscpd` and `knip` config, per-package vitest and coverage config, the 300-line counting rule, the marker regex and issue format, how dependency rules reference not-yet-existing packages, and `tsconfig` project references are not decided. |
| IR14 | Major | i18n | Message syntax, library choice, Hebrew plurals, key naming, initial key set, `direction.ts` API and the formatting source (`Intl` or in-house). |
| IR15 | Major | Worker | Message shapes, coalescing window, stale-result rule and how it is tested under Vitest. |
| IR16 | Major | Phase allocation | The allocation rule, the neutral-current formula, and the default with no user assignment. |
| IR17 | Major | Junction conversion | Tested, but no command, function or file implements it. |
| IR18 | Major | Diagnostics | No stable code list or naming scheme, and no ID scheme or entry list for `trace/formulas.ts`. |
| IR19 | Major | Net derivation | Edge cases unspecified: an open switch, a terminal with zero wires, a wire to a deleted junction, two explicit junctions on one terminal. |
| IR20 | Major | Test assertions | No tests for boundary non-convergence at the cap or the many-converter network, missing-input diagnostics per solver, floating nodes, the breaking-capacity comparison, sizing, derating and earth-loop cases, the phase-allocation label, negative fixtures for the build rules, unknown data preserved on load, or i18n direction. fast-check run count, seed policy and tolerances are not stated. The base-voltage invariance property is undefined. No coverage enforcement location. |
| IR21 | Nit | Line 521 | "Step 6" has no referent. |
| IR22 | Nit | Phase 1 exit | The owner sign-off has no stop-and-report instruction for an AI session. |
| IR23 | Nit | Circuits | Auto-suggestion has no Phase 1 or Phase 2 file. |

## Codebase details findings

The reviewer verified most Blue Grid claims. Items that agree with the design: file line counts (938, 1,410, 812), 40 component types, 104 optional property fields, the above-zero fault test (`test/islands.test.ts` line 288), the transformer impedance mismatch (`registry.ts` lines 57-58 against `VoltagePropagation.ts` lines 245-257), breaking capacity never compared, bare-threshold protection (`Protection.ts` line 31), silent defaults, dead duplicate physics, 16 `alert(` calls, no `.github` folder, no `strict` in the TypeScript config, and a single commit.

| ID | Severity | Scope | Finding |
| --- | --- | --- | --- |
| CD1 | Blocker | Line 79, Hebrew in engine logic | Only 17 files under `simulation/` contain Hebrew, and 11 more are in `lib/`, `utils.ts` and `constants.tsx`. The "over 100" figure is the whole codebase (141 files, 128 without tests), mostly UI. The brief words it correctly. Reword to "about 140 files, including 17 under `simulation/`". |
| CD2 | Blocker | Line 67 and Alternative B | The constant-current half of "one solver silently takes over for mixed AC and DC networks and constant-current loops" is contradicted by `solverIntegration.ts` lines 14-18 and 131-132, which say regulator sections no longer force the fallback. Only converter-coupled levels and unsupported shapes fall back (lines 270 and 302). There are three solver paths (radial, mesh, legacy load flow). The legacy solver is also a user setting (`ElectricalEngine.ts` lines 255 and 258), so "silently" applies only to the per-island fallback. The brief makes the same overstatement. |
| CD3 | Blocker | Line 77, "no schema version" | `useFileIO.ts` line 76 writes `projectInfo.version = APP_VERSION`, and `migrateProjectData` migrates "legacy format" files. The file has an app version and an ad-hoc migration, and lacks a schema version and a migration chain. Reword. |
| CD4 | Blocker | Lines 521 and 548-549 | The plan treats `design_draft.md` as existing and marks `docs/designs/flow-engine.md` and `README.md` as Create. The draft file is gone and both design files exist. The actions should be "exists, no action" or Modify. |
| CD5 | Major | Line 81 | The three-file list omits the 1,285-line tutorial overlay. |
| CD6 | Major | Line 63 and Alternative D | The transformer error is hedged "appears to", which is appropriate. Type-name checks are about 220 comparisons plus about 52 `.includes(type)` checks, so "well over 100" is true, but the counting method is not stated. |
| CD7 | Major | Phase 0 vs file list | The phase table puts the standards manifest in Phase 0, while the file list puts `manifest.ts` in Phase 1. Goal 8 says Phase 1. |
| CD8 | Major | Goal 17 vs plan | Goal 17 promises `platform` interfaces in Phase 0, but no `packages/platform` file appears before Phase 6. |
| CD9 | Major | Coverage gate | No coverage provider, threshold configuration or vitest coverage setting is in any Create list. |
| CD10 | Major | Phase 1 tests | No unit-test file is named for short circuit, cable, earth fault, diagnostics, trace or phase allocation. Specific happy-path and edge cases are missing. |
| CD11 | Major | Root `package.json`, `CLAUDE.md` | No scripts, dependencies, versions or `exports`. The dependency-rule row does not spell out `i18n` and `editor` rules for the tool. |
| CD12 | Major | ULID | Library and version are not stated, and the uniqueness source for "never reused" is unspecified. |
| CD13 | Nit | `io` layer | Lists a Blue Grid converter, while the Non-Goals rule out opening Blue Grid files in the core. The Phase 3 `io` row omits it. |
| CD14 | Nit | Scripts | `pnpm -r build` and the root `build` script should match. |
| CD15 | Nit | Test count | The grep gives 186. The design should keep "about 187". |
| CD16 | Nit | Python requirements | No Python or pandapower version pin, contradicting the pinning stance. |
| CD17 | Nit | Line 517 | "As the plan's own rule requires" points to a rule that appears only in the planned `CLAUDE.md` content. |

## Style findings (DetailedRange)

| ID | Severity | Scope | Finding and action |
| --- | --- | --- | --- |
| SY9-1 | Major | Line 720 | "Proposed tolerances" are hedged yet enforced, and cover only the pandapower set. CALIBRATE: state binding tolerances per set, or say they live in `tests/reference-cases/README.md` and who approves them. |
| SY9-2 | Major | Line 723 | The 85 percent coverage number has no stated reason or enforcement location. DROP "coverage never replaces the reference tests". |
| SY9-3 | Major | Line 627 | "Under the terms settled in the open question" points to a question that no longer exists. State the rule: entered by the owner, with a source tag per value. |
| SY9-4 | Major | Line 517 | "As the plan's own rule requires" is circular. Cite the section. |
| SY9-5 | Major | Lines 681 and 725 | "Settled either way" and "without the owner's review" are ambiguous. Define pass or fail, and say where review is recorded (`docs/verification/signoff.md`). |
| SY9-6 | Major | Line 611 | "Round-trips" does not say what equal means. Match `roundtrip.test.ts` and say the loaded project equals the saved one. |
| SY9-7 | Major | Lines 588 and 598 | "Never deletes data silently" has two readings, and "a new one is added for every version" does not say which version or who. |
| SY9-8 | Major | Lines 583-595 | "A snapshot can always be rebuilt from the log" is an unqualified guarantee of untested behaviour. State it as a requirement tested by a named test. |
| SY9-9 | Nit | Line 519 | "Single defensible answers, decided here and not asked" is self-congratulatory. Pin the Node major version. |
| SY9-10 | Nit | Line 517 | "Would be invented detail" is defensive. Shorten. |
| SY9-11 | Nit | Lines 534 and 541 | "High complexity", "short and binding" and "user-facing" need numbers or definitions. |
| SY9-12 | Nit | Lines 533 and 586 | "Which Blue Grid left unchecked" and "exercised from day one" are jabs or slogans. DROP. |
| SY9-13 | Nit | Line 532 | "Cannot change a verified number unnoticed" overclaims. Say a dependency update becomes a reviewed change. |
| SY9-14 | Nit | Line 651 | "Balanced-model estimate" is uncalibrated. Say what is assumed. |
| SY9-15 | Nit | Lines 674-679 | "Standard IEEE test networks" names none, and "reviewed by the owner" omits the independence requirement. |
| SY9-16 | Nit | Lines 688-724 | "More kinds", "first-run guide" and "five to ten user journeys" are imprecise. |
| SY9-17 | Nit | Lines 716-725 | The verification plan switches bullet style and repeats the Phase 1 exit text. |
