# Goldfish Annotated Review Report

**Target:** `docs/designs/flow-engine.md` (full file)
**Status:** open (no edits applied yet)

One entry per action item of [consolidated_review_report.md](./consolidated_review_report.md). Source IDs refer to the stage reports in this folder. Severity is the highest severity among the source findings and is not changed here.

**Reading the categories.** PROPOSE FIX: the critique is valid and the edit is stated. **Owner choice: yes** means the fix has more than one defensible form, or it changes a decision the owner made at a gate, so "auto accept" skips it and the owner is asked. CONTEST: the critique is wrong or off-target, with evidence the reviewer could read. DECLINE: a Nit that is not worth fixing.

**Counts:** 20 PROPOSE FIX (8 need an owner choice), 2 CONTEST (partial), 1 DECLINE group.

## Items that need the owner (listed first)

B1, B2, B4, M1, M2, M3, M6 and M12 below. They need a choice, not only approval.

---

### [B1] [`egm-design`, `egm-inventive-catalyst`, `egm-implementation-readiness`, `egm-zoom-out`] - Severity: Blocker
*   **Affected Scope:** Engine, "Unbalanced loads on a balanced solver"; Goal 6; Phase 1 row; CUJ 3 ([Technical Plan](../../designs/flow-engine.md))
*   **Discrepancy Description:** A balanced positive-sequence solver carries no neutral or earth-conductor information, yet Phase 1 includes earth-fault loop and minimum phase-to-earth short circuit, and the design labels neutral results "estimate" without a method. Sources: D6, D7, IC1, IR9, IR16, I1, SY9-14.
*   ***AI Suggestion:*** PROPOSE FIX. **Owner choice: yes.**
*   ***Justification:*** The critique is valid. No stated method exists, and a label does not protect a user who sizes a neutral or protective conductor from the result. Three defensible resolutions: (a) cut neutral sizing and earth-loop checks from Phase 1 and return "not supported" for them, (b) state a method with an error bound, (c) adopt a conductor-level nodal assembly, which is Alternative K and changes Decision 1. The Stage 8 reviewer recommends (a) as the simplest and advises against (c) until unbalanced analysis is needed.
*   ***Proposed Edit:***
    *   Location: Goal 6, Engine "Unbalanced loads" paragraph, Phase 1 row, CUJ 3, Non-Goals.
    *   Change under (a): Goal 6 lists load flow, voltage drop, short circuit (three-phase and phase-to-phase), and cable sizing for phase conductors. Earth-fault loop and phase-to-earth short circuit move to the second gate (Phase 4). Delete `phase-allocation.ts` and the "balanced-model estimate" text. State that the result of neutral and PE sizing is "not supported" until then. Change CUJ 3 to say the per-conductor data feeds the bill of quantities and, from Phase 4, the earth-loop check.

### [B2] [`egm-implementation-readiness`, `egm-inventive-catalyst`, `egm-codebase-details`, `egm-comprehension`] - Severity: Blocker
*   **Affected Scope:** Layers and dependency rules table; Goal 17; Phase table ([Technical Plan](../../designs/flow-engine.md))
*   **Discrepancy Description:** `model` imports nothing yet validates parameters against kind schemas in `catalog`. `scene` imports `views`, which imports `engine`. `platform` interfaces are promised in Phase 0 but appear only in Phase 6. The table leaves adapter location and `engine` to `i18n` imports unstated. Sources: IR1, IC6, CD8, C7, I2.
*   ***AI Suggestion:*** PROPOSE FIX. **Owner choice: yes** (one confirmation).
*   ***Justification:*** A dependency contradiction is an architectural defect. The Stage 8 reviewer recommends one rule and I agree it is the least disruptive: `model` holds a structural schema and a validator supplied by `catalog` is injected at load time; `scene` depends on result types defined in `model`, not on `views`; `platform` interfaces are types only and arrive in Phase 0; adapters live only in `editions`; `engine` and `model` do not import `i18n`.
*   ***Proposed Edit:***
    *   Location: layer table rows for `model`, `scene`, `platform`, `engine`, `i18n`, `editions`; Goal 17; the Phase 0 row.
    *   Change: replace the rows per the rule above, add "result and view-model types" to the `model` row, and add `packages/platform` (types only) to the Phase 0 package list.

### [B4] [`egm-implementation-readiness`, `egm-zoom-out`, `egm-codebase-details`] - Severity: Blocker
*   **Affected Scope:** Detailed Implementation Plan (all) ([Plan](../../designs/flow-engine.md))
*   **Discrepancy Description:** Stage 9 finds Phases 0 and 1 not implementable from the text (commands, entity schemas, units, file format, engine entry point, solver numerics, short-circuit and sizing algorithms, standards data, reference cases, lint rules, tool configuration). Stage 5 finds about 150 file rows too detailed for a design. Sources: IR2-IR12, IR13-IR20, Z6, CD9-CD12.
*   ***AI Suggestion:*** PROPOSE FIX. **Owner choice: yes.**
*   ***Justification:*** Both reviewers are right about different artefacts. Behavioural detail changes as code teaches, so it belongs in specs that can change. The design already requires one spec per feature before work.
*   ***Proposed Edit:***
    *   Location: Detailed Implementation Plan.
    *   Change: replace the Phase 0 and Phase 1 file tables with package and folder lists (like the Phases 2-6 table). Keep the pseudo-schemas, the verification plan and the exit gates. Create `docs/specs/phase-0-foundations.md` and `docs/specs/phase-1-engine.md` holding the file lists and every item the readiness reviewer named. Add a one-line rule that no phase starts without its approved spec.

### [M1] [`egm-zoom-out`, `egm-inventive-catalyst`, `egm-design`, `egm-comprehension`] - Severity: Major
*   **Affected Scope:** Event log; Decision 3 row; Alternatives O, P; Phase 6 gate; Open Questions pointers ([Technical Plan](../../designs/flow-engine.md))
*   **Discrepancy Description:** The log is both the saved project and the sync unit, but migrations and compaction rewrite history. Snapshots at every save grow the file, a 20 MB file is parsed as one JSON, atomic write and recovery are unstated, and shared history leaks author data. Its only stated justification, cloud sync, is out of scope for release 1. Sources: Z2, IC3, D11, D3, C9, IR2, IR5.
*   ***AI Suggestion:*** PROPOSE FIX. **Owner choice: yes** (changes Decision 3).
*   ***Justification:*** The critique is valid. Two defensible options: (a) keep the log but make the current model canonical and the log a derived journal, with migrations that read old commands without rewriting them, compaction only by explicit request, and a retention rule for snapshots, or (b) save the current model as a versioned document with an in-memory undo stack and add a log when sync is built. "Commands are the only write path" gives the seam under both.
*   ***Proposed Edit:***
    *   Location: Event log section, Decision 3 row, Alternatives (add a new entry), Phase 6 gate.
    *   Change: per the owner's choice. Under (a): add the sentences above, a snapshot retention rule, atomic write and recovery, and a note that exported files strip author fields. Under (b): rewrite the section as a versioned document with undo stack and move the log to Future Improvements. In both cases add the alternative to event sourcing to the Alternatives section.

### [M2] [`egm-zoom-out`, `egm-inventive-catalyst`, `egm-design`] - Severity: Major
*   **Affected Scope:** Rendering and drawing description; Decision 4 row; Alternatives Q, R; Phase 2 prototype ([Technical Plan](../../designs/flow-engine.md))
*   **Discrepancy Description:** The stated reason for SVG (browser bidirectional text, focus, styling) does not carry to canvas, DXF or PDF, so `scene` must do its own bidirectional layout and text measurement. Drift between two renderers is reduced and not removed. Sources: Z5, IC4, D15.
*   ***AI Suggestion:*** PROPOSE FIX. **Owner choice: yes** (changes Decision 4).
*   ***Justification:*** Valid. Options: (a) keep hybrid and extend the Phase 2 Hebrew prototype to canvas, DXF and PDF, or (b) SVG first with `scene` kept as the seam for DXF and PDF, and a canvas layer added only after a measured problem.
*   ***Proposed Edit:***
    *   Location: Rendering section, Decision 4 row, Alternatives Q and R, risks.
    *   Change: per the owner's choice. Under (b): remove the canvas renderer and the handover tests from the committed scope, keep `scene`, record the measurement trigger for adding canvas.

### [M3] [`egm-zoom-out`, `egm-design`] - Severity: Major (Z1 is a Blocker in Stage 5)
*   **Affected Scope:** Goals 7, 14, 15, 17; Delivery phases; Risks ("Scope") ([Design](../../designs/flow-engine.md))
*   **Discrepancy Description:** No minimum first release is named as the real cut line, no Blue Grid parity checklist exists, and the scope has no effort estimate. Sources: Z1, D18, I7.
*   ***AI Suggestion:*** PROPOSE FIX. **Owner choice: yes.**
*   ***Justification:*** Valid. The design says phase gates allow stopping, but does not say where release 1 ends. Goal 7 includes series loops, which the owner asked to be fully supported, so marking Phase 4 "not committed" conflicts with an owner wish and needs the owner's choice.
*   ***Proposed Edit:***
    *   Location: Delivery phases table; Risks.
    *   Change: add a "First release" line stating the minimum slice (proposed: Phases 0-3 with the eight core components and the first calculation gate), add a Blue Grid parity checklist of features and what happens to each, and state which phases are committed. The owner decides whether Phases 4-6 are "not committed" or "planned".

### [M6] [`egm-design`, `egm-implementation-readiness`, `egm-zoom-out`, `egm-style`] - Severity: Major
*   **Affected Scope:** Goal 1; Decisions "Reference test cases"; Phase 1 reference cases; Verification Plan
*   **Discrepancy Description:** Tolerances are "proposed" yet enforced, cover only the pandapower set, and have no derivation. The Israeli profile depends on the owner's hand calculations and the owner is also author and sole signer. No statement of who carries liability for "verifiable". Sources: D9, IR11, Z9, SY9-1, SY9-15, I6.
*   ***AI Suggestion:*** PROPOSE FIX. **Owner choice: yes** (tolerance numbers and the second-engineer condition).
*   ***Justification:*** Valid and central to the product claim. The design should state binding tolerances per reference set and who approves them, keep part of the set independent of the owner, condition any public "verifiable" claim on a second engineer, and add an intended-use statement. Named IEEE cases belong in the Phase 1 spec.
*   ***Proposed Edit:***
    *   Location: Goal 1; the reference-test decision bullet; Verification Plan.
    *   Change: replace "proposed" with binding tolerances per set (the owner confirms the numbers), add "a second engineer confirms the Israeli-law cases before any public claim of verification", and add one intended-use sentence to Overview.

### [M12] [`egm-comprehension`, `egm-design`] - Severity: Major
*   **Affected Scope:** Circuit entity decision; Project model table
*   **Discrepancy Description:** Membership is plural in the decision but singular in the entity row. The suggestion rule is undefined for meshed and parallel feeders, and the fate of user-edited circuits after network changes is undefined. Sources: C8, D16.
*   ***AI Suggestion:*** PROPOSE FIX. **Owner choice: yes** (the rule).
*   ***Justification:*** Valid. A circuit stores overrides only (members the user added or removed, way, phase) and derives the rest, with a diagnostic for stale overrides. The suggestion rule applies to radial paths only. For meshed or parallel feeders no suggestion is made and the user assigns members.
*   ***Proposed Edit:***
    *   Location: Circuit entity bullet; Circuit row in the entity table.
    *   Change: "ordered devices" becomes "members (a device may appear in several circuits)", add the overrides rule and the meshed-network sentence.

---

## Mechanical items

### [B3a] [`egm-codebase-details`, `egm-style`] - Severity: Blocker
*   **Affected Scope:** The Problem; Alternatives A, B, D
*   **Discrepancy Description:** Factual overstatements about Blue Grid: Hebrew "in over 100 files" attributed to engine logic (141 files in all, 17 under `simulation/`), "no schema version" (the file carries an app version and an ad-hoc migration), the constant-current fallback claim (contradicted at `solverIntegration.ts` lines 14-18 and 131-132; there are three solver paths and the legacy path is also a user setting), the large-file list omitting the 1,285-line tutorial overlay, test count (186 by one grep). Unexecuted claims lack a mark. Sources: CD1, CD2, CD3, CD5, CD6, CD15, SY1-SY5.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Verified against the code by the codebase reviewer and, for the transformer item, by me. Factual errors carry the justification for the rewrite.
*   ***Proposed Edit:***
    *   Location: The Problem (all bullets), Alternatives A, B and D, Overview where repeated.
    *   Change: "in about 140 files, 17 of them under `simulation/`"; "carries only the app version, and migration identifies the format by shape"; replace the constant-current sentence with "mixed AC and DC networks, converter boundaries and unsupported shapes fall back to a third, older solver, which is also selectable as a setting"; "files of 800 to 1,400 lines"; "about 187 test cases (186 by one count)"; change the preamble to "None of the following was executed. Each was read from source" and cite file and line per bullet; replace "a large factor" with the hand-computed ratio (primary over secondary voltage, squared, about 3,000 for 22 kV to 0.4 kV) or delete it.

### [B3b] [`egm-design`] - Severity: Major (D5)
*   **Affected Scope:** The Problem (transformer bullet); Alternative D
*   **Discrepancy Description:** The critic says the transformer claim "may be wrong or partial" because `VoltagePropagation.ts` around line 238 scales upstream impedance correctly.
*   ***AI Suggestion:*** CONTEST (partial)
*   ***Justification:*** The line the critic cites handles the upstream chain and is correct. The claim concerns the transformer's own impedance: `registry.ts` lines 56-58 compute it from `input.voltage` (the primary for a step-down), and `VoltagePropagation.ts` lines 253-257 add it without scaling. The codebase reviewer reached the same reading independently. The critic's other point stands and is accepted in B3a: the claim is unexecuted and must say so, and one case should be run.
*   ***Proposed Edit:***
    *   Location: none for the contested part. In B3a, add "A 22 kV to 0.4 kV case in Phase 1 (`transformer-sides.json`) settles this."

### [B5] [`egm-codebase-details`, `egm-comprehension`, `egm-implementation-readiness`] - Severity: Blocker
*   **Affected Scope:** Detailed Implementation Plan lines about `design_draft.md`, `docs/designs/*`, "Step 6", the standards manifest
*   **Discrepancy Description:** The plan marks files that now exist as Create, refers to a moved draft and to "Step 6", and places the standards manifest in Phase 0 in one table and Phase 1 in another. Sources: CD4, CD7, C15, IR21.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Plain inconsistencies.
*   ***Proposed Edit:***
    *   Location: "Existing files" paragraph and Documentation table; Phase table; catalog file list.
    *   Change: delete the `design_draft.md` sentence, change the two design files to "exists", remove "(Step 6)", move the manifest to Phase 0 (and keep its contents in the Phase 1 spec).

### [M4] [`egm-zoom-out`] - Severity: Major
*   **Affected Scope:** Engine; worker; Alternative D; Phase 1
*   **Discrepancy Description:** The design plans fresh worker and mesh code without recording a reuse decision against Blue Grid. Sources: Z3, SY5, Stage 8 Part 3.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Verified by code search in Stage 8. `workerProtocol.ts` is pure and has 12 tests, so port it. `MeshSolver.ts` is a Gauss-Seidel iteration on a CSR matrix with thin tests, so adapt it and replace silent guards with diagnostics.
*   ***Proposed Edit:***
    *   Location: Alternative D; Engine "Worker" paragraph; Phase 1 package list.
    *   Change: add the two decisions, define "stale" as "result sequence differs from the in-flight sequence", state that other Blue Grid helpers (`spatialIndex`, `viewport`, `pathfinding`, `TCCModal`) are decided at their phases, and state which Blue Grid test numbers are ported and that each is re-verified against an independent reference.

### [M5] [`egm-zoom-out`, `egm-design`] - Severity: Major
*   **Affected Scope:** Decision 5 row; Alternatives S, T; Engine numerics
*   **Discrepancy Description:** No technical reason for rejecting a library, dense LU may not be needed in Phase 1, and no target project size or latency exists. Sources: Z4, D10.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The in-house choice stands as an owner decision. It needs a stated reason and a measurable scope.
*   ***Proposed Edit:***
    *   Location: Decision 5 row; Alternative S; Risks.
    *   Change: add the reason (full control of diagnostics and no dependency drift in verified numbers) and the trade-off. State that Phase 1 decides in its spec whether dense LU is needed. Add one sentence: "Target: projects of N devices recalculate in under M seconds, measured in Phase 1" with N and M set in the spec.

### [M7] [`egm-comprehension`, `egm-structural`, `egm-style`, `egm-design`, `egm-zoom-out`] - Severity: Major
*   **Affected Scope:** Overview "Decisions made while drafting"; Open Questions; lines referring to open questions
*   **Discrepancy Description:** The section mixes owner decisions and Claude proposals unlabelled, repeats other sections (licence tampering, reference-case review, product-name search results), cites "Open Questions" that no longer exist, and includes items outside version 1. Sources: C1, C2, D3, ST2, SY6, SY9, SY10, Z8, IC9.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The Overview should be short, and a reader should know whose each decision is.
*   ***Proposed Edit:***
    *   Location: Overview subsection, Open Questions, Event log and Alternative K pointers.
    *   Change: move the subsection to the Technical Plan under "Decisions and their origin" with a column "Owner decision / Claude proposal". Delete the duplicated entries. Move cloud lock, licence, zero-sequence defaults and snapshot numbers to Risks and later specs. Replace "see Open Questions" with a pointer to the decision entry. Delete "Questions raised by later review are added here". Drop competitor names from the product-name entry.

### [M8a] [`egm-design`, `egm-comprehension`, `egm-structural`, `egm-zoom-out`] - Severity: Major
*   **Affected Scope:** Alternatives Considered
*   **Discrepancy Description:** "Not selected by author" entries have no decisive criterion or trigger, no alternative to event sourcing is listed, the heading says "four" for five decisions, K to T carry a "Reason for Rejection" heading with no reason, and Alternative F says "recommendation". Sources: D1, D2 (event-sourcing part), C4, ST1, ST8, Z10, I5.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The author gave no reason at the gates, so the honest form is a labelled "no reason recorded" plus a measurable trigger to revisit.
*   ***Proposed Edit:***
    *   Location: Alternatives intro and K to T; the "four" heading; Alternative F.
    *   Change: rename the heading to "five"; retitle the field "Status" for gate entries with the text "Not selected by author at the gate (no reason recorded). Revisit if [trigger]"; add the alternative "Plain document with undo stack" (after M1 is decided); replace "recommendation" with "the owner accepted this".

### [M8b] [`egm-design`] - Severity: Major (D2, partial)
*   **Affected Scope:** Alternatives (desktop wrapper, engine runtime, save container)
*   **Discrepancy Description:** The critic asks for alternatives on Electron versus Tauri, server-side engine versus in-browser, and the save container.
*   ***AI Suggestion:*** CONTEST (partial)
*   ***Justification:*** Server-side calculation is already a Non-Goal ("The engine runs on the user's device"). The desktop wrapper is a Phase 6 item and Alternative H weighs web-first against desktop-only. Adding Electron-versus-Tauri now is a decision with no input yet. The save-container question is covered by M1.
*   ***Proposed Edit:***
    *   Location: none.

### [M9] [`egm-design`] - Severity: Major
*   **Affected Scope:** Goal 6; Engine "Short circuit"
*   **Discrepancy Description:** IEC 60909 does not cover DC (IEC 61660) or series loops, motor contribution is part of the standard, and no table says which calculation applies to which power type. Sources: D8.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Keep the c, KT and KG factors in the spec.
*   ***Proposed Edit:***
    *   Location: after the solver table in Engine.
    *   Change: add a table "Calculation by power type": rows for load flow, voltage drop, short circuit, sizing, earth loop; columns for AC three-phase, AC single-phase, DC, series loop; each cell names the standard or "not supported (diagnostic code)".

### [M10] [`egm-inventive-catalyst`] - Severity: Major
*   **Affected Scope:** Goal 2; CUJ 1; Project model (Wire)
*   **Discrepancy Description:** "No silent defaults" conflicts with CUJ 1 creating a default cable on each new wire. Source: IC5.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. One sentence resolves it without a new entity.
*   ***Proposed Edit:***
    *   Location: Goal 2; CUJ 1 "Then"; Wire row.
    *   Change: "A new wire stores a visible default cable with origin 'default', which the user can change. The trace shows the origin."

### [M11] [`egm-comprehension`, `egm-codebase-details`, `egm-structural`] - Severity: Major
*   **Affected Scope:** Goals tags; layer table; architecture diagram; Phase table
*   **Discrepancy Description:** DXF scope per phase is unclear (Goal 12 against Goal 15), switching-order logic is in the engine row but absent from file lists, the diagram omits editor-to-engine and has no legend, "Phase 1 trace gate" tests data but the trace panel is Phase 2. Sources: C5, C6, C14, Z11.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Plain inconsistencies.
*   ***Proposed Edit:***
    *   Location: Goal 12 and 15; diagram; Phase 1 gate text.
    *   Change: Goal 12 "DXF of the diagram", Goal 15 "DXF of the panel layout"; add an arrow from `editor` to `engine` and a legend "arrow = reads from"; Phase 1 gate "every calculation result carries a trace record (data)"; add `engine/src/switching/` to the Phase 3 package list.

### [M13] [`egm-design`] - Severity: Major
*   **Affected Scope:** Risks and Limits; Editions; Non-Goals
*   **Discrepancy Description:** No threat model, client-side licence checks can be removed, import and export hardening is unstated, legal path for standards tables, dependency licences, Hebrew text in DXF and PDF. Sources: D12, D13, D14, D15.
*   ***AI Suggestion:*** PROPOSE FIX (minimal) with DECLINE for the rest
*   ***Justification:*** Most of this is Phase 6 or implementation detail. The Stage 8 reviewer agrees. Two architectural points are worth recording now.
*   ***Proposed Edit:***
    *   Location: Risks and Limits.
    *   Change: add "Licence checks run in client code and can be removed. This is a business exposure for the web trial." Add "Cloud storage needs a threat model before Phase 6." Add "SVG text is never injected as markup, and spreadsheet exports neutralise cells that start with = + - or @." Add "Standards tables are data behind a profile interface, so user-supplied tables stay possible." The Phase 2 prototype covers the renderers that exist in Phase 2 only. Declined for now: tenant isolation, encryption, data-protection plan, dependency licence inventory.

### [M14] [`egm-style`] - Severity: Major
*   **Affected Scope:** Plan lines on snapshots, compaction, load, round-trip, tolerances, exit gates
*   **Discrepancy Description:** Unqualified guarantees ("can always be rebuilt", "never deletes silently", "round-trips", "settled either way", "without the owner's review") and a dangling reference ("terms settled in the open question"). Sources: SY9-3 to SY9-8, SY15.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. These ambiguities leave the exit gates undefined.
*   ***Proposed Edit:***
    *   Location: the named rows and exit lines.
    *   Change: "A snapshot must be rebuildable from the log, tested by `snapshot.test.ts`"; "load keeps unknown data and reports it"; "a project loaded after saving equals the saved project"; "the transformer-side test passes, or the code is corrected and the test then passes"; "owner review is recorded in `docs/verification/signoff.md`"; "values are entered by the owner with a source tag per value"; attribute the owner's reasons with "in the owner's words".

### [M15] [`egm-structural`] - Severity: Major
*   **Affected Scope:** internal references; separator; `CLAUDE.md` mention
*   **Discrepancy Description:** Internal references are plain paths that would not resolve from `docs/designs/`, Blue Grid paths are unqualified, and the rule before the plan is missing. Sources: ST3-ST7, CD13.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: wherever `docs/research/boq_options.md`, `concepts_brief.md` and Blue Grid paths appear.
    *   Change: use `[BoQ options](../research/boq_options.md)` and `[Concepts brief](../../concepts_brief.md)`; prefix Blue Grid paths with "Blue Grid v0.87:"; add `---` before the Detailed Implementation Plan; write "`CLAUDE.md` (created in Phase 0)"; remove the Blue Grid converter row from the `io` layer table, or mark it "later, outside the core".

### [IC2] [`egm-inventive-catalyst`] - Severity: Major
*   **Affected Scope:** Engine "Boundaries"
*   **Discrepancy Description:** Boundary iteration accepts non-convergence as a user-visible failure, and short circuit crosses transformers. Resolution proposed: a single coupling interface per converter.
*   ***AI Suggestion:*** PROPOSE FIX (minimal)
*   ***Justification:*** The deeper redesign is Phase 4 work. The design should record the trigger.
*   ***Proposed Edit:***
    *   Location: Engine "Boundaries", Risks.
    *   Change: "If boundary iteration fails to converge on reference networks with several converters, replace it with an equivalent-source coupling interface per converter. Short circuit uses the whole-network sequence model."

### [N1] [`egm-style`, `egm-comprehension`, `egm-structural`, `egm-codebase-details`] - Severity: Nit
*   **Affected Scope:** various
*   **Discrepancy Description:** Subjective or pejorative wording ("useful ideas", "teaches its own rules", "patched by hand", "a rule nobody wrote down", "carries the cost of its growth", slogans), unexplained terms ("Dekel", "EGM", "gate", "chrome", series-loop terms), repeated statements about direction, a placeholder migration, an unsourced command `author`, no Python version pin, naming mismatch for build scripts, missing stop-and-report instruction, circuit auto-suggestion file. Sources: C3, C10-C13, C16-C18, SY7-SY14, SY9-9 to SY9-17, CD14, CD16, CD17, IR22, IR23.
*   ***AI Suggestion:*** PROPOSE FIX (batch, edits stated at apply time)
*   ***Justification:*** Cheap and valid. Each rewrite states the observable fact. Terms get one-line glosses on first use. Direction rules stated once in the i18n section. Command `author` becomes "set by `platform` identity". Add "pandapower version pinned in `requirements.txt`" and "at the Phase 1 exit the AI session stops and reports to the owner".

### [N2] [`egm-structural`, `egm-style`, `egm-comprehension`] - Severity: Nit
*   **Affected Scope:** Alternatives heading depth; goal list spacing; repeated direction statements; filler repeats
*   **Discrepancy Description:** Alternatives K to T sit at H5 under H3 and H4 (ST8), numbered goals use mixed spacing (ST7), direction is stated three times (C12), concept-review support is repeated (SY14).
*   ***AI Suggestion:*** DECLINE
*   ***Justification:*** Valid hierarchy and cosmetic. Not worth the churn.
*   ***Proposed Edit:***
    *   Location: none.

### [Z7] [`egm-zoom-out`] - Severity: Major
*   **Affected Scope:** Catalog size (40 to 20-24)
*   **Discrepancy Description:** The brief says the owner's field-usage list should override the code-only triage. The design does not record that it was obtained.
*   ***AI Suggestion:*** PROPOSE FIX (record only)
*   ***Justification:*** The owner gave eight core components. The remaining triage is a code-only recommendation and should be labelled that way.
*   ***Proposed Edit:***
    *   Location: Goal 13.
    *   Change: add "The eight core components come from the owner. The remaining list of 20 to 24 is a code-based triage that the owner confirms before Phase 4."
