# Consolidated Review Report: Flow Engine design

**Target:** `docs/designs/flow-engine.md` (729 lines at review time). **Date:** 2026-11-27. **Mode:** consolidated, uninterrupted full flow (stages 5, 6, 7, 9, then 8).

## Reviewer status

| Stage | Reviewer | Status |
| --- | --- | --- |
| 5 | `egm-zoom-out` | completed |
| 5 | `egm-inventive-catalyst` | completed |
| 6 | `egm-comprehension` | completed |
| 7 | `egm-design` | completed |
| 7 | `egm-structural` | completed |
| 7 | `egm-style` | completed |
| 8 | `egm-zoom-out` (intermediate) | completed |
| 9 | `egm-implementation-readiness` | completed |
| 9 | `egm-codebase-details` | completed |
| 9 | `egm-style` | completed |

Stage reports: [zoom_out_report.md](./zoom_out_report.md), [comprehension_report.md](./comprehension_report.md), [critic_report.md](./critic_report.md), [intermediate_zoom_out_report.md](./intermediate_zoom_out_report.md), [implementation_readiness_report.md](./implementation_readiness_report.md).

## Limits of this review

* All reviewers read code and documents. None ran Blue Grid (`node_modules` is absent). Engine claims about Blue Grid are "by reading".
* The Elephant confirmed one finding by reading the code: the transformer impedance mismatch (`registry.ts` lines 56-58 against `VoltagePropagation.ts` lines 253-257). The design critic doubted it, citing a different, correct line. Still unexecuted.
* Stage 5 said `MeshSolver.ts` is a sparse direct solver. Stage 8 corrected this: it is a Gauss-Seidel iteration. The corrected statement is used here.
* The three domain-flavoured reviews of the concept (electrical, UX, developer) happened earlier and are not repeated here.
* A reviewer may be wrong. The Stage 8 reviewer rejects or defers many requests from Stages 6, 7 and 9 as too detailed for a design document. Those are listed as "defer to specs", not dropped.

## Summary

The design's core ideas are not challenged: node-based topology, a solver per power type, no silent defaults, and owner-signed reference tests. The review found five Blockers and several contradictions. Three of the Blockers are mechanical to fix. Two need an owner decision. Four reviewers also question choices the owner made at decision gates, and those are listed as owner decisions.

## Prioritized action items

Type: **Fix** is mechanical and needs no decision. **Decide** needs the owner. **Spec** moves detail into a per-phase spec.

### 🔴 Blockers

| # | Item | Type | Source findings |
| --- | --- | --- | --- |
| B1 | **Neutral, per-phase and earth-loop results.** A balanced positive-sequence solver has no neutral or PE information, yet Phase 1 promises earth-fault loop and minimum phase-to-earth short circuit, and the design labels neutral results "estimate". State one method with its error bound, or cut neutral sizing and earth-loop checks from Phase 1 (Stage 8 recommends cutting), or switch to a conductor-level nodal assembly (Alternative K, which conflicts with Decision 1). | **Decide** | D6, D7, IC1, IR9, IR16, I1, SY9-14 |
| B2 | **Layer contradiction.** `model` may import nothing, yet validates parameters against kind schemas in `catalog`. `scene` depends on the solver through `views`. `platform` interfaces are promised in Phase 0 but appear only in Phase 6. Rule: `model` holds a structural schema and a validator is injected at load, `scene` uses result types from `model`, and `platform` interfaces are types only and come in Phase 0 (or Goal 17 is reworded). | **Fix**, with one choice to confirm | IR1, IC6, CD8, C7, I2 |
| B3 | **Factual corrections about Blue Grid.** Hebrew is in about 140 files, 17 under `simulation/`, not "over 100 in engine logic". The saved file has an app version and ad-hoc migration but no schema version. The constant-current fallback claim is contradicted (`solverIntegration.ts` lines 14-18 and 131-132), and there are three solver paths. Mark every "by reading" claim as unexecuted, cite file and line, and drop "large factor". Use "about 187" and give the counting method (186 by one grep). Add the tutorial overlay to the large-file list. | **Fix** | CD1, CD2, CD3, CD5, CD6, CD15, SY1-SY5, D5, I3 |
| B4 | **The plan is not implementable and not at design altitude.** Stage 9 fails Phases 0 and 1 (12 Blockers: commands, entity schemas, units, file format, engine entry point, solver numerics, short-circuit and sizing algorithms, standards data, reference cases, lint rules). Stage 5 says the file-level plan is too much for a design. Resolution: keep the design at package and folder level, write Phase 0 and Phase 1 specs under `docs/specs/` before work, and carry the missing behaviour there. | **Spec**, with the approach to confirm | IR2-IR12, Z6, I-Part 2 |
| B5 | **Stale or wrong rows in the plan.** The plan treats `design_draft.md` as existing and marks `docs/designs/flow-engine.md` and `README.md` as Create, "Step 6" has no referent, and the manifest is Phase 0 in one place and Phase 1 in another. | **Fix** | CD4, CD7, C15, IR21 |

### 🟡 Major

| # | Item | Type | Source findings |
| --- | --- | --- | --- |
| M1 | **Event log as the saved project.** Reviewers note: its only justification is cloud sync (Phase 6, a non-goal for release 1); it makes the file hold two things to migrate; migration and compaction rewrite history, which conflicts with using the log as the sync unit; snapshots at every save grow the file; a 20 MB file parsed as one JSON has latency and crash-safety risk; the log leaks author history on sharing. Options: keep the event log with current state canonical and the log as a journal (read-time migration, no rewriting), or save the current model as a versioned document with an in-memory undo stack and add a log when sync is built. This conflicts with the owner's Decision 3. | **Decide** | Z2, IC3, D11, D3, C9, IR2, IR5, I-D11 |
| M2 | **Two renderers.** Reviewers say the stated SVG advantage (browser Hebrew and focus handling) does not carry over to canvas, DXF or PDF, so `scene` must do its own bidi and text measurement. Options: keep hybrid as chosen, or SVG first with `scene` as the seam and canvas added after a measured problem. This conflicts with the owner's Decision 4. | **Decide** | Z5, IC4, D15 |
| M3 | **First-release cut line.** Name the minimum first release and mark Goals 7, 14, 15 and 17 and Phases 4-6 as "not committed". Goal 7 includes series loops, which the owner asked to be fully supported. Add a Blue Grid parity checklist. | **Decide** | Z1, D18, I7 |
| M4 | **Reuse decisions against Blue Grid.** Port `workerProtocol.ts` nearly verbatim with its 12 tests. Adapt `MeshSolver.ts` (CSR assembly and Gauss-Seidel loop) for `ac3-mesh.ts`, and replace its silent guards with diagnostics. Decide `spatialIndex`, `viewport`, `pathfinding` and `TCCModal` at their phases. Map Blue Grid test numbers to reference cases and say which are trusted. Record this in Alternative D. | **Fix** | Z3, SY5, I-Part 3 |
| M5 | **Numeric core rationale.** State why a maintained library was not chosen, and decide whether a dense LU is needed in Phase 1 at all, since mesh load flow is iterative. Add a stated target project size and latency, to be measured in Phase 1. | **Fix** | Z4, D10 |
| M6 | **Reference tests.** Make tolerances binding per reference set and say who approves them. Keep independence: part of the set from outside the code and the owner. Condition any public claim of verification on a second engineer, and add an intended-use and liability sentence. | **Fix**, tolerance numbers to confirm | D9, IR11, Z9, SY9-1, SY9-15, I6 |
| M7 | **"Decisions made while drafting" and Open Questions.** Mark each entry as owner decision or Claude proposal. Remove duplicates (licence tampering, reference-case review). Fix pointers at lines 263 and 449. Move entries outside version 1 (cloud lock, licence, zero-sequence defaults, snapshot numbers) to Risks or a later spec. | **Fix** | C1, C2, D3, ST2, SY6, SY9, SY10, Z8, IC9, I4 |
| M8 | **Alternatives section.** Replace "Not selected by author" bare entries with a decisive criterion and a revisit trigger. Add the missing alternative to event sourcing (plain document with undo stack). Fix the "four" vs five count and the "Reason for Rejection" headings for K to T. Do not add Electron, Tauri or server-runtime alternatives now. | **Fix** | D1, D2, C4, ST1, ST8, Z10, I5 |
| M9 | **Standards scope per power type.** Add a small table: calculation, standard, and the "not supported" result. IEC 60909 does not cover DC (IEC 61660) or series loops, and motor contribution is part of the standard. Keep c, KT and KG factors in the spec. | **Fix** | D8, I-Part 1 |
| M10 | **Goal 2 against CUJ 1.** State that a default cable is stored on the wire, visible, with origin "default". No new entity. | **Fix** | IC5 |
| M11 | **Phase tags and layer clarity.** DXF scope per phase, where switching-order logic lives, the diagram arrows and legend, where platform adapters live, whether `engine` may import `i18n`, and what the Phase 1 trace gate tests. | **Fix** | C5, C6, C7, C14, CD7, Z11 |
| M12 | **Circuit entity.** Define singular vs plural membership, the suggestion rule for meshed networks, and the fate of user edits after network changes. | **Fix**, rule to confirm | C8, D16, IC5 |
| M13 | **Security and legal, kept at design altitude.** Two lines in Risks: client-side licence checks can be removed (a business exposure for the web trial), and cloud needs a threat model before Phase 6. One constraint line on input hardening: SVG text never injected as markup, spreadsheet formula injection. Keep standards tables as data behind a profile interface so user-supplied tables remain possible. | **Fix** | D12, D13, D14, I-Part 1 |
| M14 | **Calibration of style.** Replace unqualified guarantees ("can always be rebuilt", "never deletes silently") with requirements and named tests, define pass or fail for Phase 0 and Phase 1 exits, and attribute the owner's reasons. | **Fix** | SY9-3 to SY9-8, SY15 |
| M15 | **Links and structure.** Convert internal paths to relative Markdown links, prefix Blue Grid paths, add the separator before the plan, mark `CLAUDE.md` as to be created. | **Fix** | ST3-ST7, CD13 |

### 🟢 Nits

Wording and consistency items: subjective phrases ("useful ideas", "teaches its own rules", "patched by hand", slogans), unexplained terms ("Dekel", "EGM", "gate", "chrome", series-loop terms), repeated statements about direction, unnamed counts, undefined "user-facing" lint scope, a placeholder migration, command `author` source, Python version pin, minor script naming. Sources: C11-C13, C16-C18, ST4-ST7, SY7-SY14, SY9-9 to SY9-17, CD14, CD16, CD17, IR22, IR23.

### Deferred to per-phase specs, not dropped

Field-level schemas, command payloads, units, file layout, solver algorithms and tolerances, short-circuit factors, sizing and earth-loop formulas, standards table format, reference-case format and named cases, lint plugin rules, tool versions, diagnostic codes, test assertions, worker message shapes, i18n syntax. Sources: IR2-IR20.

### Deferred to later phases

Norton or Thevenin coupling for boundaries (IC2), tiered owner review (IC7), capability policy objects (IC8), cloud lease, tenant isolation and encryption (D12, D13), dependency licence inventory (D14), Electron versus Tauri and server runtime alternatives (D2).

## Owner decisions needed

These five are choices only the owner can make, because they change a gate decision, a product scope or the way the plan is organised.

1. **B1:** For neutral, per-phase and earth-loop results in Phase 1, cut them from Phase 1, state a method with an error bound, or adopt the conductor-level nodal assembly.
2. **M1:** Keep the event log (with current state canonical and the log a journal), or save a versioned document with an undo stack and add the log when sync is built.
3. **M2:** Keep the hybrid SVG and canvas renderers, or SVG first with canvas after a measured problem.
4. **M3:** Which first release is the cut line, and does "not committed" for Phases 4-6 conflict with your wish for full series-loop support?
5. **B4:** Move the Phase 0 and Phase 1 file-level detail into specs under `docs/specs/` and keep the design at package level.

## Traceability matrix

Each raw finding maps to the action item that addresses it. IDs are defined in the stage reports.

| Raw findings | Action item |
| --- | --- |
| D6, D7, IC1, IR9, IR16, SY9-14 | B1 |
| IR1, IC6, CD8, C7 | B2 |
| CD1, CD2, CD3, CD5, CD6, CD15, SY1-SY5, D5 | B3 |
| IR2-IR12, Z6 | B4 |
| CD4, CD7, C15, IR21 | B5 |
| Z2, IC3, D11, C9, IR2, IR5 | M1 |
| Z5, IC4, D15 | M2 |
| Z1, D18 | M3 |
| Z3, SY5 | M4 |
| Z4, D10 | M5 |
| D9, IR11, Z9, SY9-1, SY9-15 | M6 |
| C1, C2, D3, ST2, SY6, SY9, SY10, Z8, IC9 | M7 |
| D1, D2, C4, ST1, ST8, Z10 | M8 |
| D8 | M9 |
| IC5 | M10 |
| C5, C6, C14, Z11 | M11 |
| C8, D16 | M12 |
| D12, D13, D14 | M13 |
| SY9-3 to SY9-8, SY15 | M14 |
| ST3-ST7, CD13 | M15 |
| IC2, IC7, IC8, D4, D17 | Deferred |
| C3, C10-C13, C16-C18, ST4-ST8, SY7, SY8, SY11-SY14, SY9-9 to SY9-17, CD9-CD12, CD14, CD16, CD17, IR13-IR15, IR17-IR20, IR22, IR23 | 🟢 Nits or specs |
| Z7 | Open: owner's component list (eight core components given; remaining triage undecided) |
