# Stage 8: Intermediate Zoom Out Review

**Target:** `docs/designs/flow-engine.md` (lines 1-729), with Stages 5, 6, 7 and 9 reports as context. **Reviewer:** `egm-zoom-out` (standard: `zoom-out-standard`). Status: completed. Findings are condensed. Severity is the reviewer's.

The reviewer passes context sufficiency and concludes that the design should absorb the cheap, high-value corrections from Stages 5-9 and move behavioural detail into specs.

## Part 1: Audit of requested additions

### Genuinely needed

| ID | Severity | Scope | Finding |
| --- | --- | --- | --- |
| I1 | Blocker | Unbalanced loads on a balanced solver; Goal 6; Phase 1 gate (D6, IC1, IR16) | The one real root-problem hole. A positive-sequence solver gives no neutral or PE information, yet Phase 1 promises earth-loop and phase-to-earth faults. State one method at architecture level or cut neutral and loop sizing from Phase 1. Cutting is simpler. Do not adopt IC1's single conductor-level nodal assembly now, because it is Alternative K and speculative until unbalanced analysis is needed. Keep `phase-allocation.ts` only if its method is stated. |
| I2 | Blocker | Layer table vs `model` (IR1, IC6, CD8) | A dependency contradiction is an architectural defect. `model` imports nothing, yet validates device parameters against kind schemas in `catalog`. Decide one rule: `model` holds a structural schema and a validator is injected at load. Reconcile `scene` importing `views`, so drawing uses result types from `model`. |
| I3 | Major | Problem section; Alternatives B and D (CD1-CD3, SY1, SY2, D5) | Factual corrections are required because they carry the justification for a rewrite. Hebrew in engine logic is "about 140 files, 17 under `simulation/`". The file carries an app version and an ad-hoc migration, so "no schema version" needs rewording. The constant-current fallback claim is contradicted at `solverIntegration.ts` lines 14-18 and 131-132. Mark every "by reading" item as unexecuted and drop "large factor" unless a case is run. |
| I4 | Major | "Decisions made while drafting"; Open Questions (C1, C2, D3, ST2, SY6) | Mark each entry as owner decision or Claude proposal, delete duplicates, fix dangling pointers, and move out-of-version-1 items to Risks or a later spec. This shrinks the document. |
| I5 | Major | Alternatives (D1, D2, C4) | Label "Not selected by author" entries honestly, add a decisive criterion and a revisit trigger, and add the missing alternative to event sourcing: a plain document with an undo stack (Z2). Do not add Electron, Tauri or server-runtime alternatives now, since that is Phase 6 YAGNI. |
| I6 | Major | Reference tests (D9, IR11, Z9) | Fixed tolerances are a design-level promise because "verifiable" is the product claim. State binding tolerances per set and who approves them. Name individual IEEE cases in the Phase 1 spec, not the design. |
| I7 | Major | Scope and phases (Z1, D18) | Name the minimum first-release cut line. Mark Goals 7, 14, 15 and 17 and Phases 4-6 as "not committed". Add a Blue Grid parity checklist. |

### Would cause YAGNI, weeds, premature optimisation or dead-ends (reject or defer)

| Source IDs | Verdict |
| --- | --- |
| IR2-IR10, IR13, IR14, IR18-IR20 | Field-level schemas, command payloads, solver tolerances and caps, short-circuit factors, i18n syntax, lint plugin, tool versions, diagnostic codes: an altitude drop in the design. They belong in the Phase 0 and Phase 1 specs. The design's pseudo-schemas are already at about the right altitude. |
| D10 | Add one sentence: a stated target size and latency, to be measured in Phase 1. Do not design sparse solving, cancellation or damping now. |
| D11 | A symptom of the event-log choice, which Z2 already questions. Fix the cause before adding mitigations. IC3's epochs and read-time upcasting add machinery. If the log stays, state only that current state is canonical and the log is a journal. |
| D12, D13 | Phase 6 YAGNI. Add two lines to Risks. Keep one line on input hardening: SVG text never injected as markup, and formula injection in spreadsheet export. |
| D14 | Keep only the architectural point: standards tables are data behind a profile interface, so user-supplied tables stay possible. Skip the dependency-licence inventory. |
| D15 | Extend the Hebrew prototype only to the renderers that exist in Phase 2. Prefer Z5 and IC4: SVG first, canvas after a measured problem, with `scene` kept as the seam for DXF and PDF. |
| IC2 | Deferred design for Phase 4. Keep boundary iteration with its cap and diagnostic, and record the coupling interface as a revisit trigger. |
| IC5 | Resolve Goal 2 vs CUJ 1 with one statement: the default cable is stored on the wire, visible, with origin "default". No new entity. |
| IC7, IC8 | Defer. One is process and the other is Phase 6. |
| D6, D8 | Add a small table of calculation, standard and "not supported" result. Keep c, KT and KG factors out of the design. |

## Part 2: Stage 5 against Stage 9

The two stages do not conflict. Stage 5 objects to the file inventory (about 150 rows of per-file rationale). Stage 9 objects to the absence of behavioural contracts. Both are right and they point at different artefacts.

**The design keeps:** layers, import rules and entity responsibilities; interface shapes (solver contract, command envelope, diagnostic and trace records); decisions with failure conditions; phase scopes, exit gates and one sentence of method per major calculation; and package-level folders for every phase (replacing the Phase 0 and Phase 1 file tables).

**Per-phase specs under `docs/specs/`, one each for Phase 0 and Phase 1, written before work starts:** the file list and per-file purpose; field-level entity schemas and command payloads; file format layout; unit system; solver algorithms, tolerances, caps and slack behaviour; IEC 60909 factors; sizing and earth-loop formulas; standards table and manifest format; reference-case format and named cases; lint plugin rules; tool versions and configuration; diagnostic code list; test assertions.

The design already says one spec per feature before work. Extend that to Phases 0 and 1, and remove the "every file" claim. This also removes the stale `design_draft.md` row and the "Step 6" reference.

## Part 3: Blue Grid reuse, verified by code search

**`simulation/MeshSolver.ts` (240 lines).** The Stage 5 claim is partly wrong. It is pure and dependency-free, with no imports and typed arrays. It is **not** a sparse direct solver. It is Gauss-Seidel iteration on a CSR Y-bus, using a single-phase-equivalent formulation, one voltage level and balanced only, capped at 500 iterations with a tolerance of 1e-4 V. It carries a fixed-current regulator mode and a warm-start option. Its tests are thin: 4 cases in `test/mesh.test.ts`, mostly agreement with a radial sweep or loose bounds. It has no LU or conditioning, so it does not replace `numeric/lu.ts`.

Recommendation: **adapt, not port as is.** Take the CSR assembly and the Gauss-Seidel loop as the start of `ac3-mesh.ts`. Replace string IDs with the new net and node types. Remove the constant-current branch (Phase 4, a separate solver). Replace the `1e-12` silent division guards with diagnostics, since they conflict with Goal 2. Keep the warm start only if measured to matter. Re-verify against independent reference cases.

**`simulation/workerProtocol.ts` (107 lines).** The Stage 5 claim holds. `createProtocol<A>()` is pure with no DOM or Worker dependency. It enforces one solve in flight, latest arguments win, and stale results are dropped by `seq`. It has 12 unit tests. Recommendation: **port nearly verbatim** into `engine/src/worker/`, with its tests. Define "stale" as "result `seq` differs from the in-flight `seq`". Rewrite only the request and response payload types.

Record both decisions in Alternative D and the Phase 1 spec. The other Stage 5 candidates (`lib/spatialIndex.ts`, `lib/viewport.ts`, `lib/pathfinding.ts`, `TCCModal.tsx`) were not examined here and are to be decided at their phases.
