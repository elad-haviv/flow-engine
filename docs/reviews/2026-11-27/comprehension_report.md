# Stage 6: Comprehension Test

**Target:** `docs/designs/flow-engine.md`. FeatureRange lines 1-512 and DetailedRange lines 513-729. **Reviewer:** `egm-comprehension`, which read only this file with no context. Status: completed.

## What this proposes (FeatureRange, 1-512)

Flow Engine is a new web app, replacing Blue Grid, for electricians and engineers. They draw single-line diagrams, run checked calculations (load flow, short circuit, cable sizing, earth-fault loop), and generate switching orders, circuit schedules, bills of quantities and DXF files. It is built as layered packages: a screen-less model, catalog and engine at the bottom, with views, scene, editor and UI above. The saved project is an append-only command log with snapshots. Each power type has its own solver, with converters as explicit boundaries. Topology is derived from terminals and wires, with junctions stored only when explicit. Work is phased 0-6, with owner-signed reference tests gating releases.

## How the existing system works, per this document (FeatureRange)

Blue Grid is a switching and fault rehearsal tool. It has one flat property bag per component, a component-to-component graph, and a single link per wire. Its transformer impedance is applied on the wrong side (found by reading, not executed). It fills missing inputs with silent defaults, and it runs two solvers with a silent fallback. Its tests mostly check self-agreement. Its UI uses alert boxes and hidden modes, and its files carry no schema version.

## What this proposes (DetailedRange, 513-729)

Phases 0 and 1 are specified file by file. Phase 0 covers tooling, CI rules, ADRs and the `model` and `i18n` packages. Phase 1 covers `catalog`, `engine`, reference cases and a pandapower generator. Phases 2-6 are listed as packages only, each needing a spec first. The plan includes pseudo-schemas and a verification plan.

## How the existing system works, per this document (DetailedRange)

Only the repository state is described. `concepts_brief.md`, `docs/research/boq_options.md` and `design_draft.md` exist.

The reviewer could paraphrase every section. No section is a Blocker on that test.

## Findings

| ID | Severity | Scope | Finding |
| --- | --- | --- | --- |
| C1 | Major | "Decisions made while drafting" | Titled as decisions to challenge, but entries read as settled or contradict their own framing. The busbar entry says the owner confirmed three, the licence-tampering entry duplicates the offline-licence entry, and the product-name entry says the owner decided. A reader cannot tell owner decisions from Claude proposals. Mark each. |
| C2 | Major | Open Questions vs lines 263 and 449 | The section says none, but line 263 says the cloud rule "is open (see Open Questions)" and line 449 also points there. Both are recorded as decisions elsewhere. Redirect the pointers. |
| C3 | Major | Undefined project terms | "Concepts brief" and "fresh-reviewer review" are not linked from the Overview. "Dekel" is used with no definition. "EGM" and "Step 6" have no referent. "Gate" and "single-select gates" are unexplained. "Phase 0 manifest" is defined only later. |
| C4 | Major | Alternatives | The intro separates "Not selected by author" from "Rejected by author", but K to T give no reason and sit under a "Reason for Rejection" heading. Alternative F says "recommendation", which conflicts with "Not selected". |
| C5 | Major | Goals tags vs phase table | Goal 12 puts DXF in Phase 3 while Goal 15 puts panel DXF in Phase 5, so DXF scope per phase is unclear. Switching-order logic is in the `engine` layer row but absent from Phase 1 files while the Phase 3 row adds it. |
| C6 | Major | Architecture diagram | It shows `scene` reading `model` and `views` fed by `engine`, but not how `editor` uses the engine, and has no arrow legend. |
| C7 | Major | Layer table | Where platform adapters live is not stated. It is unclear whether `engine` may import `i18n`. |
| C8 | Major | Circuit entity | A device may be in several circuits, but the Circuit row says "ordered devices and cable" in the singular. The downstream-suggestion algorithm is undefined for meshed networks. |
| C9 | Major | Event log numbers | Line 50 gives 20 MB compaction and snapshots every 200 commands, while the event-log section says only "at intervals" and "never compacts silently". |
| C10 | Major | Worker | "Coalesces rapid requests and drops stale results" has no message shape and no definition of "stale". |
| C11 | Nit | CUJ 6 | "Brightness steps", "compliance voltage" and "lamp transformers" are airfield-lighting terms with no gloss. |
| C12 | Nit | Direction | Mirroring and left-to-right drawing space are stated three times. "Chrome" is undefined. |
| C13 | Nit | Standards editions | "Latest edition when Phase 0 starts" gives no date. |
| C14 | Nit | Phase 1 gate | "Every result has a trace" is a data test, but the trace panel in CUJ 2 is Phase 2. |
| C15 | Nit | Plan, line 521 | Says `design_draft.md` moves at finalisation. It has already moved. |
| C16 | Nit | `eslint.config.js` row | "User-facing code" and "device-kind comparisons outside `catalog`" cannot be linted without a stated path scope. |
| C17 | Nit | `migrations/v1.ts` | Described as a placeholder, yet `log-v1.json` is the first real fixture. |
| C18 | Nit | Pseudo-schema | The command envelope has `author: string` with no source, though identity lives in `platform`. |
