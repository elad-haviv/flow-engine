# Blue Grid parity checklist

* **Author:** Elad Haviv (owner), drafted with Claude Code
* **Status:** Owner decisions recorded, by delegation (every row follows the Elephant's recommendation)
* **Date:** 2026-11-27

## Decisions

On 2026-11-27 the owner chose to follow the Elephant's recommendation on every row: 317 accepted as proposed, 40 changed to a different decision. The 25 rows that were the owner's own call were taken by delegation, not by review, and are listed in [recommendations.md](../parity/recommendations.md). They can be reversed in the [checklist page](https://claude.ai/artifact/1FLzpfZJtSiquFLY6bGPWQ) or by telling the Elephant.

## Purpose

This answers one question: is every Blue Grid feature accounted for in Flow Engine? A feature counts as accounted for when its row says what happens to it (keep, redesign, merge, drop, or later), where it lives in the [design](./flow-engine.md), which [mockup](https://claude.ai/artifact/3TYAhKp4fGEwi363Qsnssn) shows it, and when the owner has marked the row.

The decisions here are **proposals**. Nothing is decided until the owner marks a row.

## How to use it

1. Open one of the four slice files below.
2. In each row, mark the **Owner** column: ✓ accept the proposed decision, ✗ reject it, or write a note.
3. Rows marked **LATER** need no mockup now, but they need one before their phase starts.
4. Features that appear in more than one slice are meant to match. The reconciliation of duplicates is still open (see "Known gaps in this checklist").

## What was read, and how

Four independent reads of Blue Grid v0.87, each by a fresh reviewer working from the code and none shown the others' results. They were read only: nothing was executed.

| Slice | File | Rows | What it covers |
| --- | --- | --- | --- |
| UI surfaces | [ui-surfaces.md](../parity/ui-surfaces.md) | 73 | Every dialog, panel, menu and control group |
| Editing and canvas | [editing-interactions.md](../parity/editing-interactions.md) | 90 | Tools, selection, wiring, zones, subsystems, shortcuts, files, persistence, touch, accessibility |
| Feature history | [history.md](../parity/history.md) | 107 | Every distinct feature in 162 changelog versions, the README and the docs, plus a table of removed or replaced features |
| Components and simulation | [components-and-simulation.md](../parity/components-and-simulation.md) | 87 | One row per component type (40) and per simulation or automation behaviour (47) |
| **Total** | | **357** | |

## Proposed decisions, by slice

| Slice | KEEP | REDESIGN | MERGE | DROP | LATER | Total |
| --- | --- | --- | --- | --- | --- | --- |
| UI surfaces | 15 | 25 | 11 | 1 | 21 | 73 |
| Editing and canvas | 38 | 31 | 6 | 3 | 12 | 90 |
| Feature history | 30 | 54 | 13 | 3 | 7 | 107 |
| Components and simulation | 26 | 24 | 15 | 2 | 20 | 87 |
| **Total** | **109** | **134** | **45** | **9** | **60** | **357** |

Counts come from a script that parsed the four tables, not from hand counting. Many features appear in more than one slice, so 357 rows are fewer than 357 distinct features.

## Mockup coverage

**90 of the 357 rows** name a home with "no mockup yet": [gaps-no-mockup.md](../parity/gaps-no-mockup.md), generated from the four slices. By theme, the missing mockups are:

* Landing page, recent projects and project rename.
* Settings, help, component help, changelog and usage policy dialogs.
* Zones and the layers pane, annotation shapes, and subsystem grouping with breadcrumbs.
* Calculators and protection: the cable sizing calculator, the time-current curve viewer, protection settings, and leakage tools.
* Load monitoring: the monitor tool, the per-component graph and the load-balance report.
* Control logic authoring: synchroniser, ATS, interlock, and the fuel-tank link.
* UPS and battery panels, and the operational toolbox (earthing, lock-out, fault, fuse replace).
* Context menus for edit and simulate modes.
* The phone view.

## Corrections found while compiling this

The scans checked earlier statements in the design documents against the code. Findings:

| Finding | Effect |
| --- | --- |
| The Interlock XOR/AND setting **is** used (`lib/switchingLogic.ts` line 40). The brief said "stored and never used". | Corrected in the brief. Interlocks are a real feature with a rule to port (COMP-029, CH-044). |
| An RCD reads only its own node's leakage, so an RCD upstream of a leaking load may not trip (SIM-014, by reading). | Possible Blue Grid defect. Do not port the behaviour. Settle with a test in Phase 4. |
| The constant-current regulator's "open circuit" trip checks a string that nothing in `simulation/` sets (COMP-027, SIM-018). | Probably dead code. Series loops need a real open-circuit detection in Phase 4. |
| Delete and cut do not check the lock flag (ED-012, ED-013), although the design says that was patched. | Needs a test in the editor phase. |
| Context-menu bugs: "forward" equals "front", "backward" equals "back", and distribute does nothing (ED-033, ED-036). | Do not port. Specify the behaviour. |
| The tutorial wipes the project on start (ED-062), which contradicts goal 9 of the design. | Already addressed by the first-run mockup. |
| An applied arc fault on a disconnector latches with no repair path seen (SIM-027). | Decide the repair rule when the switching logic is specified. |

## Inconsistencies between slices (not yet reconciled)

* **Zones and layers pane:** the UI slice proposes Phase 4 (UI-015, UI-029), while the editing and history slices propose Phase 2 (ED-020 to ED-023, CH-012, CH-013).
* **Settings:** simulation settings are proposed for Phase 1 (UI-064) and the settings dialog for Phase 2 (ED-081, CH-035).
* **Phone view:** the history slice names no phase for it (CH-102), while the UI slice proposes Phase 6.
* **Operational toolbox and the simulation context menu:** proposed for Phase 3 in one slice (CH-049) and Phase 4 in others (ED-050 to ED-053, UI-017).

## Known gaps in this checklist

* **Duplicates are not merged.** The same feature can appear as a UI row, an editing row and a history row. A reconciliation pass would give one row per feature.
* **Unverified items.** The tutorial overlay and the switching-order preview were read only partly. Rows marked *unverified* were not confirmed.
* **Nothing was run.** Behaviour is described from reading the code. Node modules are missing, so Blue Grid's tests were not run.
* **Components follow the code-based triage** from the concepts brief, except for the eight core components that you named. The rest is a proposal until you mark it.
* **Features nobody used.** Blue Grid features that no real user relies on are not distinguished from those they do. Your marks are the only source for that.

## Recommendations

The Elephant's recommendation for every row is in [recommendations.md](../parity/recommendations.md): 317 rows recommended as proposed, 40 with a different decision, 25 flagged as the owner's call, and 28 with a different phase. Five fresh reviewers produced them by topic group, and the Elephant reconciled the conflicts between groups. Reasons marked *Unverified* were not checked against the Blue Grid code. The owner marks the rows in the [interactive checklist](https://claude.ai/artifact/1FLzpfZJtSiquFLY6bGPWQ).

## Next steps

1. Owner marks the four slice files. Rows that conflict with the design, or that you want changed, get a note.
2. Reconcile duplicates and the four inconsistencies above, and fold the result into one list.
3. Add mockups for the themes above, starting with the ones in Phases 1 to 3.
4. Link the final list from the Phase 0 and Phase 1 specs, so each feature row has an owner phase.
