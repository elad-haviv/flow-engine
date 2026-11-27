# Phase 3 exit report (partial)

* **Date:** 2026-11-27
* **Status:** Slices A to C and the core of D built. Slice E and F and parts of D **not built**. Phase 3 is not complete and the first release is not ready.

## What was built

* **`views`:** the circuit schedule (one row per consumer: nearest upstream protective device found through switches and busbars, cable, power, current, voltage, drop, fault level, cable check) and the bill of quantities (devices by kind and attributes; cables by material, insulation and cross-section with slack per end and spare length shown on the line; assembly items from a visible rules table; pricing from imported price lists, manual prices, and a discount).
* **`io`:** CSV with a byte-order mark; a price-list importer (any column order, comma or semicolon, bad rows reported and skipped); an ASCII DXF writer (one layer per diagram layer, y flipped, non-ASCII text as `\U+XXXX`).
* **Documents dialog** in the web app: both tables, price-list import, discount, allowance settings, CSV and DXF export, and the switching order.
* **Switching order** (`engine/src/switching.ts`): for the selected components, finds the switches that bound them, opens load-breaking devices before isolators, locks them out, proves the part dead, closes the earthing points; and the reverse to restore. The network is solved after each step to check the interlock rules: an isolator is not opened with current flowing, earthing is not closed on a live part, the part is dead after the switches open, and an earthing point exists. Exportable as CSV.

## Gates

| Gate | Result |
| --- | --- |
| 1. Golden-file tests | Pass for the DXF (`packages/io/tests/golden/sample.dxf`); the CSV writers are tested by assertions on columns and rows, not by a golden file |
| 2. The DXF opens in an independent reader | Pass: read with `ezdxf` (strict read and recover mode) with no errors; Hebrew text decodes correctly. Not tried in AutoCAD or LibreCAD |
| 3. The owner checks a bill of quantities against a project they know | **Open** |
| 4. Slices D to F built or moved by the owner | **Open** |

`pnpm verify` passes: 220 unit tests; branch coverage of `views` is 87 percent and `io` 95 percent; 36 of 36 browser checks pass, including a documents journey (open the dialog, read the schedule, import a price list, see the line priced, download the CSV and DXF).

## Not built

* **Slice D, remainder:** a switching *log* (recording what was done and when), and operator tools that change switch states and lock-out flags in a running session. The plan is a document only.
* **Slice E:** Blue Grid file converter (the owner's call).
* **Slice F:** PDF and word-processor documents.
* Price lists are kept in the browser session only; they are not saved in the project file. Manual prices likewise.
* The assembly rules are code data, not editable in the interface.
* Hebrew text in the DXF is stored in logical order; CAD programs that do not reorder right-to-left text will show it reversed.

## Open items for the owner

1. A real price list (any format the supplier gives) to test the import against.
2. Check a bill of quantities against a project you know.
3. Decide on slices D, E and F: build now, move later, or drop.
