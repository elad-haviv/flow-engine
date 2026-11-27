# Phase 2 spec: the editor

* **Author:** Elad Haviv (owner), drafted with Claude Code
* **Status:** Draft. Built in slices; each slice below says what is done and what needs people.
* **Date:** 2026-11-27
* **Depends on:** [Phase 0](./phase-0-foundations.md), [Phase 1](./phase-1-engine.md). **Design:** [flow-engine.md](../designs/flow-engine.md).

## Purpose

A person who has never seen the tool places a source, a breaker and a load, connects them, sees the calculation, and fixes what the problems panel says, without help. The editor is thin: every change is a model command, every result comes from the engine.

## Scope

**In:** the drawing description (`scene`) and symbols; an SVG renderer; editor state with tools, selection, undo and redo; schema-driven property forms; the problems panel with one-click fixes; the busbar advice; compound-wire expansion; Hebrew and English with correct label direction; a mode banner with Escape to cancel; save and open through the Phase 0 storage; a first-run guide that never deletes work; a measured rendering limit.

**Out (later phases):** zones and the layers pane polish, annotation styling beyond text and rectangles, circuit schedule, documents (Phase 3); simulation overlays (Phase 3); touch and phone view (Phase 6).

## Decisions fixed by this spec

| Decision | Value | Origin |
| --- | --- | --- |
| Rendering | SVG; culling and a spatial grid; canvas only after a measured limit | Owner (design review) |
| Drawing space | Left to right; labels are bidirectional isolates; numbers and units read left to right; the chrome mirrors with the language | Owner (design) |
| Undo | Per command, with the inverse recorded by the model; redo replays the command with its recorded ids | Claude's proposal |
| Grid | 20 px; symbols are 3 by 3 cells; wires route orthogonally between terminal anchors unless the user placed waypoints | Claude's proposal |
| Busbar anchors | A wire can end anywhere along a busbar; the end follows the other end's position | Claude's proposal |
| Tool state | One tool at a time; the banner names it; Escape cancels | Owner (design) |
| First-run guide | A dismissible overlay on an empty project; it never replaces or deletes the open project | Owner (design) |
| Playwright | From this phase; run against the built shell | Owner (design) |

## Slices

| Slice | Content | Verified by | Status |
| --- | --- | --- | --- |
| A | `scene` (primitives, bounds, hit testing, spatial grid) and `symbols` (one drawing per catalog kind, terminal anchors, wire routing) | Unit tests: anchors, routing, hit tests, culling | In progress |
| B | `editor` core: state, actions, tools, undo and redo, problems and fixes | Unit tests with fast-check on undo; fix tests | In progress |
| C | `ui` and `apps/web`: SVG view, palette, property forms, problems panel, banner, language switch, save and open, guide | Playwright journeys | In progress |
| D | Rendering limit measurement | A recorded number in the exit report | Planned |
| E | Five-person first-feeder test | **Needs five people; cannot be done by Claude** | Open |

## Blue Grid parity rows in scope

| Row | Feature | Decision |
| --- | --- | --- |
| UI-001 | Landing screen: new project / import file | REDESIGN |
| UI-002 | Recent projects list | REDESIGN |
| UI-003 | Landing: tutorial entry, usage policy, settings, changelog links | MERGE |
| UI-005 | Header: project name edit | KEEP |
| UI-006 | Header: Edit / Simulate mode switch | REDESIGN |
| UI-007 | Header: Home button, version label (opens changelog) | REDESIGN |
| UI-008 | Header: Undo / Redo | KEEP |
| UI-009 | Header: New / Save / Load project buttons | REDESIGN |
| UI-011 | Header: theme toggle | MERGE |
| UI-012 | Header: accessibility button | MERGE |
| UI-013 | Header: help button | MERGE |
| UI-014 | Header: Select tool vs Zone tool switch | KEEP |
| UI-015 | Zone selection pane | KEEP |
| UI-016 | Header: Settings shortcut in sim | MERGE |
| UI-018 | Canvas controls island | REDESIGN |
| UI-019 | Canvas aids | KEEP |
| UI-020 | Left sidebar shell (collapsible) | REDESIGN |
| UI-021 | Right sidebar shell (collapsible) | REDESIGN |
| UI-022 | Component library | REDESIGN |
| UI-023 | Component help dialog | KEEP |
| UI-024 | Library hover tooltip | MERGE |
| UI-025 | Left sidebar: multi-selection panel | KEEP |
| UI-026 | Wire properties: label and style | REDESIGN |
| UI-027 | Wire properties: engineering spec | REDESIGN |
| UI-028 | Cable and protection calculator | REDESIGN |
| UI-029 | Zone properties | KEEP |
| UI-030 | Empty-selection hint | KEEP |
| UI-031 | Properties editor: label and look | REDESIGN |
| UI-033 | Properties: sources group (GRID, GEN, PV) | REDESIGN |
| UI-034 | Properties: switching devices (breaker, disconnector, earth switch, load breaker, fuse) | REDESIGN |
| UI-037 | Properties: transformer | REDESIGN |
| UI-038 | Properties: loads and EV charger | REDESIGN |
| UI-041 | Properties: annotation shapes | KEEP |
| UI-043 | Sim right panel: selected item header and status | REDESIGN |
| UI-051 | Sim panel: empty state | KEEP |
| UI-054 | System alerts log (desktop) | REDESIGN |
| UI-055 | Context menu (edit) | KEEP |
| UI-062 | Settings: accessibility and appearance | REDESIGN |
| UI-065 | Usage policy | REDESIGN |
| UI-067 | Help center | MERGE |
| UI-068 | Interactive tutorial overlay | MERGE |
| UI-069 | Confirmation dialog | KEEP |
| UI-070 | Shared form controls | REDESIGN |
| UI-073 | Phone alerts panel | MERGE |
| ED-001 | Edit/Sim mode switch | REDESIGN |
| ED-002 | Tool palette (Select / Zone) | KEEP |
| ED-003 | Click select | KEEP |
| ED-004 | Multi-select (Shift click, marquee) | KEEP |
| ED-005 | Select all (zone-aware) | REDESIGN |
| ED-006 | Drag move (multi, locked-aware) | KEEP |
| ED-007 | Snap to grid | KEEP |
| ED-008 | Rotate | KEEP |
| ED-010 | Resize components | KEEP |
| ED-011 | Arrow keys nudge | KEEP |
| ED-012 | Delete selected | KEEP |
| ED-013 | Copy / cut / paste | KEEP |
| ED-014 | Duplicate | MERGE |
| ED-015 | Undo / redo | REDESIGN |
| ED-016 | Wire drawing | REDESIGN |
| ED-017 | Wire routing (orthogonal A* / direct) | KEEP |
| ED-018 | Wire waypoints | KEEP |
| ED-019 | Wire context menu (edit) | KEEP |
| ED-020 | Location zones: draw | KEEP |
| ED-021 | Zone move and resize | KEEP |
| ED-022 | Zone selection pane (hide / lock / rename / zoom) | KEEP |
| ED-023 | Show/hide zones, grid, axes | KEEP |
| ED-028 | Graphics and annotation tools | KEEP |
| ED-029 | Place component from library | KEEP |
| ED-033 | Edit context menu (component) | REDESIGN |
| ED-034 | Component lock | KEEP |
| ED-035 | Z-order | REDESIGN |
| ED-036 | Align / distribute | REDESIGN |
| ED-037 | Rubber-band wire preview | KEEP |
| ED-038 | Zoom (wheel) | KEEP |
| ED-039 | Zoom buttons | KEEP |
| ED-040 | Pan | KEEP |
| ED-041 | Fit to screen | KEEP |
| ED-043 | Zoom to component / zone | KEEP |
| ED-044 | Level of detail and culling | REDESIGN |
| ED-054 | Hover tooltip with load flow values | REDESIGN |
| ED-055 | New project | KEEP |
| ED-060 | Recent projects | REDESIGN |
| ED-061 | Reopen last project | KEEP |
| ED-062 | Clear on new / tutorial | REDESIGN |
| ED-065 | Keyboard shortcut guard and disabled states | KEEP |
| ED-066 | Shortcut: Select all / zone select | MERGE |
| ED-067 | Help: shortcut reference | REDESIGN |
| ED-068 | Shortcuts that do NOT exist | REDESIGN |
| ED-069 | Properties edit panel | REDESIGN |
| ED-070 | Label placement and style | REDESIGN |
| ED-071 | Wire label and path offset | KEEP |
| ED-072 | Confirmation dialog (delete subsystem, new project) | KEEP |
| ED-073 | Browser alert() errors | REDESIGN |
| ED-074 | Theme (light/dark) | REDESIGN |
| ED-075 | Accessibility: font scale | KEEP |
| ED-076 | Accessibility: high contrast | KEEP |
| ED-077 | Accessibility: reduce motion | KEEP |
| ED-078 | Canvas keyboard accessibility | REDESIGN |
| ED-079 | Persisted view preferences | MERGE |
| ED-082 | Mouse cursors and edit feedback | KEEP |
| ED-084 | Wire crossings / bridges | KEEP |
| ED-085 | Busbar port by drop position | REDESIGN |
| ED-086 | Components palette in SIM hidden | REDESIGN |
| ED-087 | Shake feedback | DROP |
| ED-088 | Tutorial overlay | REDESIGN |
| ED-089 | Language / direction of editing UI | REDESIGN |
| ED-090 | Project info (name, author, stamps) | REDESIGN |
| CH-001 | EDIT / SIM modes | REDESIGN |
| CH-002 | Component library sidebar (search, categories, multi-category, saved expand state, drag or click to add) | KEEP |
| CH-003 | Component spec / help modal with live SVG preview | REDESIGN |
| CH-004 | Properties editor (per-component property forms, unit badges, validated inputs, textarea) | REDESIGN |
| CH-005 | Wires drawn port to port with orthogonal obstacle-avoiding routing | REDESIGN |
| CH-006 | Wire routing scoped to active subsystem | MERGE |
| CH-007 | Wire waypoints (split, move, remove segments) | KEEP |
| CH-008 | Direct vs routed wire mode (per wire or default) | MERGE |
| CH-009 | Per-conductor cross-sections (phase, neutral, PE) and parallel cable count | REDESIGN |
| CH-012 | Zones (Location Zones): draw, name, colour | KEEP |
| CH-013 | Zone selection pane (hide, lock, reorder, rename) | KEEP |
| CH-019 | Graphic annotations: text (multiline, typography), rectangle, circle, arrow | KEEP |
| CH-020 | Graphic style editor (fill, stroke, radius, alignment, arrowheads) and 4-way/diagonal resize | KEEP |
| CH-021 | Text stays upright when component rotated | KEEP |
| CH-022 | Label styling (position, colours, size, zoom-independent) and per-property visibility flags | REDESIGN |
| CH-023 | Canvas pan/zoom, snap grid, grid/axis display, marquee, multi-select, copy/cut/paste | KEEP |
| CH-024 | Keyboard shortcuts (Delete, R rotate, arrow nudge, context-smart Ctrl+A) | KEEP |
| CH-025 | Undo/redo with change detection and history cap | REDESIGN |
| CH-026 | Context menus in edit and sim (group, delete, leakage, LOTO, grounding) | REDESIGN |
| CH-027 | New project button, project naming modal, recent projects list, delete from list | REDESIGN |
| CH-028 | Landing / home screen with New, Import, tutorial | REDESIGN |
| CH-031 | Persisted UI preferences (sidebar and section state, alert filters) | KEEP |
| CH-033 | Light / dark theme | REDESIGN |
| CH-034 | Accessibility settings (text scale 85-140%, high contrast, reduced motion) | REDESIGN |
| CH-035 | Unified settings modal (accessibility and appearance + engine tabs) | KEEP |
| CH-038 | Usage policy modal | REDESIGN |
| CH-039 | Help center, Evolution Log (changelog) modal | REDESIGN |
| CH-040 | Interactive guided tutorial (spotlight, topic modules, gated steps, skip) | REDESIGN |
| CH-042 | Single-click operation of switches in SIM, Ctrl+click select without operating | KEEP |
| CH-074 | Spatial culling and zoom-dependent detail levels | REDESIGN |
| CH-096 | System alerts log (toast, severity filters, locate, remove, Excel export) | REDESIGN |
| CH-097 | Zoom-to-component from an alert | MERGE |
| CH-098 | Live tooltip with current in trade notation (3x100A, 1x30A, 50A(DC)) | KEEP |
| CH-100 | SIM sidebar sections (collapsible, hero status card, UPS/battery/fuel/sync widgets) | REDESIGN |
| CH-101 | Calculation display toggles (show current, voltage, power) | KEEP |
| COMP-032 | CONNECTOR | REDESIGN |
| COMP-037 | RECTANGLE (graphics) | KEEP |
| COMP-038 | CIRCLE (graphics) | KEEP |
| COMP-039 | TEXT (graphics) | KEEP |
| COMP-040 | ARROW (graphics) | KEEP |


## Exit gates

1. Slices A to D pass `pnpm verify` and the Playwright journeys.
2. The Hebrew label prototype shows mixed Hebrew and Latin labels correctly (screenshot checked).
3. The measured rendering limit is recorded.
4. Five people complete the first-feeder journey in under ten minutes. **Not met until people have tried it.**

## Open items for the owner

1. Who the five testers are and when.
2. Whether the 20 px grid and 3 by 3 symbol size suit the look you want; a designer pass on the symbols is still needed.
