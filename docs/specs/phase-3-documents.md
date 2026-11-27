# Phase 3 spec: documents

* **Author:** Elad Haviv (owner), drafted with Claude Code
* **Status:** Draft. Built in slices; the first slice (below) is built.
* **Date:** 2026-11-27
* **Depends on:** Phases 0 to 2. **Design:** [flow-engine.md](../designs/flow-engine.md), [boq_options.md](../research/boq_options.md).

## Purpose

Turn a calculated project into documents an electrician or engineer can hand over: a circuit schedule, a bill of quantities, a CAD drawing and spreadsheets. Documents are views over the model and the results; they never hold data of their own.

## Slices

| Slice | Content | Status |
| --- | --- | --- |
| A | `views`: circuit schedule and bill of quantities with price lists | Built |
| B | `io`: CSV export, price-list import, DXF export of the diagram | Built |
| C | Documents dialog in the web app | Built |
| D | Switching order and log, interlock check, lock-out and earthing tools | **Not built** |
| E | Blue Grid file converter (the owner's call) | **Not built** |
| F | PDF and word-processor documents | **Not built** |

## Decisions fixed by this spec

| Decision | Value | Origin |
| --- | --- | --- |
| Prices | Nothing is bundled. Prices come from price lists the user imports (CSV). Each line says where its price came from: list, manual, or unpriced | Owner |
| Price list format | UTF-8 CSV with the columns `key,description,unit,price,currency`; the key is the line's key shown in the bill of quantities | Claude's proposal |
| Discount | One percentage applied to the priced total, for the common "list price minus X percent" tender convention | Owner (research) |
| Cable allowances | Slack per end (default 1 m) and spare (default 5 percent) are settings and are shown on the line | Claude's proposal |
| Assembly rules | A visible table of rules (for example "two lugs per conductor end"); edited in code data for now, not in the UI | Claude's proposal |
| Spreadsheet | CSV with a byte-order mark so Hebrew opens correctly in Excel | Claude's proposal |
| CAD | ASCII DXF (R12-style entities), one layer per diagram layer, y axis flipped, non-ASCII text written as `\U+XXXX` | Claude's proposal |
| Document language | Column titles follow the interface language; the data is language-neutral | Claude's proposal |

## Circuit schedule

One row per consumer (load, motor, capacitor): name, kind, the protective device that feeds it (the nearest one upstream), cable (material, insulation, cross-section, length), power, design current, voltage at the load, voltage drop, the largest fault current at the load, and the status of the cable check. The row is empty where the engine has no value; it never shows a guess.

## Bill of quantities

Lines: devices grouped by kind and key attributes; cables grouped by material, insulation and cross-section with the routed length plus allowances; assembly items from the rules table. Each line has a key, a description made of attributes, a unit and a quantity. A line is **unpriced** until a price list matches its key. The total shows the priced sum, the number of unpriced lines and the discount.

## Blue Grid parity rows in scope

| Row | Feature | Decision |
| --- | --- | --- |
| UI-010 | Header: Snapshot (camera) button | LATER |
| UI-017 | Operational toolbox (drag tools) | KEEP |
| UI-052 | Switching log panel | REDESIGN |
| UI-053 | Log footer: generate switching order, load balance report buttons | MERGE |
| UI-056 | Context menu (simulation) | REDESIGN |
| UI-057 | Switching order preview and template | REDESIGN |
| UI-058 | Switching order export | KEEP |
| ED-050 | SIM context menu (component) | REDESIGN |
| ED-052 | Sim kit tools by drag | LATER |
| ED-058 | Import migration / legacy | REDESIGN |
| ED-063 | PNG snapshot export | MERGE |
| ED-064 | Print switching order | MERGE |
| CH-036 | PNG snapshot of the diagram | MERGE |
| CH-044 | Interlocks (XOR mutual exclusion, AND prerequisite) | REDESIGN |
| CH-049 | Operational toolbox (LOTO, portable earthing, artificial fault, fuse replace, leakage, monitor) | KEEP |
| CH-050 | Switching log (timeline, status pills, standardized Hebrew action text, zone attribution, manual rows, notes, import/export, clear) | REDESIGN |
| CH-051 | Switching order document (PDF/print, Word RTL, repeating header, page numbers, signature block, order number) | REDESIGN |
| CH-052 | Switching order from a rehearsed simulation sequence | MERGE |
| COMP-029 | INTERLOCK | REDESIGN |
| SIM-026 | Interlock check | REDESIGN |
| SIM-029 | Switching log and order | REDESIGN |


## Exit gates

1. Golden-file tests for each document (CSV and DXF) on a fixed sample project.
2. The DXF opens in an independent reader without errors (checked once with a third-party library).
3. The owner checks a bill of quantities against a project they know.
4. Slices D to F are built or moved to a later phase by the owner.

## Open items for the owner

1. A real price list to test the import, in whatever format the supplier gives.
2. Whether PDF output matters for the first release or the CSV and DXF are enough.
3. Whether the Blue Grid converter is wanted.
