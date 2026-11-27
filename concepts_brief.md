# Flow Engine

* **Author:** Elad Haviv (owner), drafted with Claude Code
* **Date:** 2026-11-27
* **Status:** Draft for owner review. No code has been written.

## Overview

Flow Engine is a clean, planned rewrite of Blue Grid, an editor and simulator for single-line electrical diagrams. It is for electricians and electrical engineers. It is Hebrew first and multilingual, with no Israeli Air Force (IAF) ties. It must produce numbers an engineer can check, and it must teach first-time users the rules of the tool in the interface itself.

Blue Grid draws a network, simulates switching, faults and protection, and prints a switching order. Flow Engine keeps that and adds: panel schedules and panel layout, bills of quantities, network simplification for load management, and CAD export. All of these are views of one project model.

AC three-phase is the default power type. AC single-phase, DC and series constant-current loops must also work. A wire is one compound object by default. The user can split it into its conductors (L1, L2, L3, N, PE, or DC poles). Many wires may share one port, and the app then asks whether a busbar would suit better.

Editions (trial, SaaS with accounts and cloud files, purchased long-term-support version with local files) are decided later. The architecture must leave room for them. Claude Code builds it under the owner's guidance, with no deadline. The first deliverable is an approved plan for structure and features.

## Analysis

Ten fresh reviewers read the concept and the Blue Grid code (v0.87) with no other context: seven EGM lenses and three domain reviewers (electrical, UX and design, developer). All ten completed. Their findings agree on the points below. Items marked "by reading" were found by reading code, not by running it.

### What Blue Grid gets wrong, in order of how much it matters

1. **The electrical numbers cannot yet be called real.** This is the largest risk to the concept.
   * Transformer impedance looks referred to the wrong side of the transformer. The code computes it at the input voltage, then adds it to a chain already converted to the output voltage. For a 22 kV to 0.4 kV unit this would overstate transformer impedance by roughly 3000 times and make fault currents far too low. I confirmed that the two code sites match this description (`simulation/physics/registry.ts:56-57`, `simulation/VoltagePropagation.ts:243-258`). I have not run it. A test with a known answer must settle it.
   * Short-circuit current uses the single shortest path from one source. IEC 60909 needs the equivalent impedance at the fault point with all sources and parallel paths. Two transformers in parallel, a ring, or grid plus generator are understated.
   * The breaking-capacity rating is displayed but never compared with the fault current.
   * Protection is a bare threshold: any current above the rating trips at once, and every device upstream of a fault trips together. There are no time-current curves and no selectivity result.
   * The earth-fault check uses a fixed rule (0.8 × V / Zs against 10 × In) and has no earthing-system concept, no disconnection-time check, and no RCD types.
   * Apparent power is added as a plain number. There is no reactive power, no power-factor correction, no demand or diversity factors.
   * Missing data is silently replaced by defaults (1.5 mm², 100 m, 22000 V, 400 V, 50 Hz, power factor 1, %Z 0). The user sees a plausible number with no sign that it is assumed.
   * Two voltage-drop numbers can appear on screen, from two solvers. A "legacy" solver is kept as a user setting and as a silent fallback for any AC/DC mix and for constant-current loops.
   * The existing 131 tests (about 187 cases) mostly check that the code agrees with itself. One fault test only asserts that the fault current is above zero, which would not catch the transformer error. The in-app usage policy still calls results "aids for practice".
2. **The data model cannot hold the owner's requirements.**
   * One flat property bag of 100 to 140 optional fields serves all 40 component types. A fuse can carry battery and fuel fields.
   * A wire is one link with a single cross-section plus separate neutral and PE sizes. There is no conductor list, so splitting a wire into L1/L2/L3 is new work.
   * Ports are bare numbers. Phases are encoded in port numbers (for example port 2 and 3 of a phase splitter mean minus and plus 120 degrees).
   * The engine treats a component as one node and walks component to component. Parallel wires between the same two components collapse to one ("first wire wins"). A load wired to the supply side of an open breaker is not energised. This is the root of the "many wires on one port" confusion.
   * Screen position is stored on the electrical component, so a panel layout, a diagram and a CAD export cannot each place the same device differently.
   * The saved file has no schema version. The loader guesses the format from its shape and silently deletes wires with missing endpoints.
3. **The interface teaches nothing.**
   * Every new wire silently gets a default cable (N2XY, 150 mm², 100 m). The busbar rule exists nowhere in the UI.
   * Errors are browser `alert()` boxes, some in English with no reason ("ATS Link Error").
   * Linking components uses a hidden mode with no banner.
   * Switching between Edit and Sim swaps both sidebars and wipes simulation state.
   * The properties editor is one 1,410-line component. Colour pickers sit above engineering data.
   * Colour carries several meanings: red is both L1 phase and fault, so an energised diagram looks like a fault. Blue is selected wire, DC wire, and primary button.
   * There are no design tokens. The code has 113 uses of 10 px text. Accessibility is a layer of `!important` overrides.
   * Right-to-left is patched by hand in 14 or more places. Mixed Hebrew/Latin labels render wrongly (for example "(PDF)" jumps to the front). There is no translation layer. Hebrew text appears in about 100 to 140 files, including engine error messages, and one alert filter works by matching Hebrew wording.
4. **The code shows "patches on patches".**
   * Several components have two copies of their physics. The registry silently overwrites the old inline copy, which was never deleted, so edits to it do nothing. One Connector file is dead. One logic setting (Interlock XOR) is stored and never used.
   * Types are compared by name in about 127 to 191 places. Adding a component means editing many files.
   * `App.tsx` (938 lines), `PropertiesEditor.tsx` (1,410), `useSimulation.ts` (812), and a 1,285-line tutorial overlay.
   * About 12 refs mirror React state to avoid stale closures. 92 call sites write project data directly. Project data is saved to browser storage on every change.
   * No CI, TypeScript is not strict, test files are not type-checked, 67 uses of `any`, and the git history is a single commit.
   * Branding and edition logic leak into the app: IAF logos in code, an OS-username lookup, about 44 browser-storage touches.
5. **The documents in `docs/` are stale** (written for v0.45). Tests and code are the real specification.

### What is worth keeping

* **The simulation core and its test numbers:** the island and topology split, the worker with its coalescing protocol, and the idea that the engine returns trip intents instead of side effects. Port the **expected numbers**, not the code, and check each against an independent reference. The tests prove self-consistency, not physical truth.
* **Some pure helpers:** pathfinding, spatial index, viewport maths. Check each before copying.
* **Ideas worth carrying:** the phone bottom-sheet pattern, and the radial-network e2e fixture as a sample project.
* **The domain knowledge** in `skills/electrical-engineer`, to read before writing the engine specification.

### The component library should shrink from 40 types to about 20–24

| Blue Grid types | Recommendation |
| --- | --- |
| GRID, GEN, PV_ARRAY, BATTERY_BANK, TRANSFORMER, EV_CHARGER, FUSE, RCD, BUSBAR, FUEL_TANK, SUBSYSTEM | Keep. GEN, TRANSFORMER, EV_CHARGER, BUSBAR, FUEL_TANK and SUBSYSTEM need redesign (loose string links, regex-parsed vector group, port count as a user property). |
| INVERTER, RECTIFIER, DCDC_CONVERTER, VFD | Merge into one converter (same base code; differ in input and output type). |
| UPS, DC_UPS | Merge, or compose from converter + battery + bypass. The hidden battery duplicates BATTERY_BANK. |
| LOAD, CURRENT_LOAD, LIGHT, HORN | Merge into one load with a mode (kVA or A) and a symbol. |
| BREAKER, LOAD_BREAKER, DISCONNECTOR, EARTH_SWITCH | Merge into one switch with a capability set. |
| ELECTRONIC_BREAKER | Keep as a protection profile, not a separate type. |
| COMBINER_BOX | Merge into a DC busbar. |
| PHASE_SPLITTER | Redesign. It disappears if a wire can split into conductors. |
| CURRENT_STABILIZER (constant-current regulator) | Redesign as a first-class power type, not a component quirk. |
| SYNCHRONIZER, INTERLOCK, ATS_CONTROLLER, ATS | Redesign as one control-logic layer. ATS and ATS_CONTROLLER do the same job twice. |
| CONNECTOR | Keep, redesign: bind by ID, not by label text. |
| SPD, POLE | Drop as simulated parts. Keep as symbols or wire waypoints if needed. |
| RECTANGLE, CIRCLE, TEXT, ARROW | Keep as an annotation layer outside the electrical model. |

These are recommendations from reading the code. The owner's list of components actually used in the field should override them.

### The scope is several products, so order matters

The reviewers agree the concept is four products in one box: (a) a diagram editor, (b) a physics simulator, (c) a design-documentation tool (schedules, bill of quantities, CAD), and (d) a commercial platform. Blue Grid is (a) and (b). Most new wishes are (c), whose users do not need a live simulator and whose outputs (paper, CAD files) are judged against standards. The project model is the one thing that unifies them. Everything else is a view or an output of the model.

### The contradictions inside the concept, and how the reviewers resolve them

| Contradiction | Resolution proposed |
| --- | --- |
| One compound wire vs separate conductors | A cable owns an ordered conductor list. The role set comes from the power system (3P+N+PE, 1P, DC+/-, series loop). "Split" is a view change on the same data. |
| Real numbers vs network simplification | The engine always solves the full network. Simplification is a derived view (series and parallel folding, load aggregation) that keeps a list of what it folded, and its totals are checked against the full result. Meshes, converters and mixed AC/DC do not fold exactly and stay expanded or are labelled "equivalent". |
| Many wires per port vs a clear topology | The model is net-based: terminals belong to nets, nets are nodes, devices are branches between nets. Several wires on one terminal simply join one net, so the solver needs no busbar. The busbar prompt is a rule about ratings, protection and bill of quantities, with a one-click "convert to busbar" fix. |
| One codebase vs very different editions | A UI-free core (model, catalog, engine, views, exports). Edition differences are adapters (storage, identity, licence, shell) and a capability list, never `if (edition)` in engineering code. |
| Guided UI vs dense professional tool | Every rule violation becomes an in-place, dismissible suggestion with a fix. One UI shell with density as a setting. |
| Four power types vs one solver | One solver per homogeneous power island. Converters are explicit island boundaries. No legacy fallback; an unsupported case is a visible diagnostic. |
| Hebrew first vs language in logic | The engine returns codes plus parameters. Text, number formats and standards profiles are data chosen at the edge. |

### The proposed layers

From lowest to highest, with the dependency rule that a layer may import only from layers below it:

1. **model**: project schema, stable IDs, units, versioned file format, migrations. Pure data.
2. **catalog**: component, cable and standards data. One record per component type (ports, ratings, power types, parameters, rules). Standards tables are tagged with their clause and swappable per country.
3. **engine**: topology, solvers, protection, load analysis, switching-order logic, network simplification. Pure TypeScript, runs in a worker, testable without a browser.
4. **views**: functions from the model to diagram, panel schedule, panel layout, bill of quantities, load analysis.
5. **symbols**: drawings keyed by catalog ID, separate from physics.
6. **io**: importers and exporters (DXF, spreadsheet, document, Blue Grid converter), one adapter each.
7. **editor and ui**: canvas, commands (the only write path, giving undo and a base for cloud sync), schema-driven property forms.
8. **platform** interfaces and **editions**: composition roots that wire adapters and capability flags.

Extension seams (registries) are needed for components, power domains, views, exporters, advice rules (the busbar hint is one), and edition capabilities.

The model needs three layers inside it: the electrical network (devices, terminals, cables, a first-class circuit or "way" for panel schedules), catalog and physical data (part numbers, sizes, prices), and per-view placements. A bill of quantities needs measured cable lengths and a priced catalog, which Blue Grid does not have.

### Risks the reviewers ranked highest

1. **"Real, verifiable numbers" is a liability promise, not a feature.** It needs cited standards, independent reference cases (IEC TR 60909-4 worked examples, IEEE test feeders, comparison with an open-source solver such as pandapower), a calculation trace on every displayed result with an "assumed value" flag, and a named human electrical engineer who signs off the reference set. Without a human sign-off, "verifiable" cannot be claimed. A non-programmer owner cannot judge a fault current by eye.
2. **Scope creep into a full electrical design suite.** Panel layout, bills of quantities and CAD each compete with established paid tools. Without a cut line, "no deadline" means no finish.
3. **The rewrite repeats the cause.** AI-driven additions without enforced structure will recreate the tangle. Rules need teeth: import-boundary checks that fail the build, one owner module per concept, a short written spec per feature, and a decisions log.
4. **Terms the concept leaves undefined:** compound wire, bus vs busbar, series constant-current loop, network simplification, panel schedule vs panel layout, bill of quantities contents, and "real numbers". They are defined in this brief where the reviewers agreed; the rest are open questions below.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * A new codebase with enforced module boundaries, a versioned file format, and strict typing.
  * Real, traceable calculations for the in-scope list (to be fixed in the plan): steady-state load flow, voltage drop, short circuit per IEC 60909, cable sizing, earth-fault loop, protection with time-current curves and selectivity.
  * Four power types: AC three-phase (default), AC single-phase, DC, series constant-current loops.
  * Net-based topology with compound wires that expand to conductors.
  * Guided first run, in-place rule hints, a problems panel, one persistent layout, a design system with light and dark themes.
  * Hebrew first with right-to-left and bidirectional text done properly, multilingual by structure, no IAF branding.
  * Views over one model: diagram, panel schedule, panel layout, bill of quantities, load analysis, simplified network.
  * Exports: DXF, spreadsheet, document, PDF.
  * A component catalog trimmed to about 20–24 types plus an annotation layer.
  * Edition seams (storage, identity, licence, capabilities) designed in from the start.
* **Out-of-Scope Non-Goals (proposed, for owner confirmation):**
  * Accounts, billing and cloud storage in the first release. Only the interfaces are designed.
  * DWG export. DXF only at first.
  * Dynamic and transient simulation beyond what the first plan explicitly lists.
  * Opening Blue Grid files in the core. A separate converter, later.
  * A mobile editing shell. A read-only phone view may follow.
  * Pricing and edition contents.

## Alternatives Weighed

Rejected during ideation and review, with the technical reason. None of these is a maintainer decision unless stated.

* **Patch Blue Grid in place.** Rejected by the owner: too many patches on patches, faulty and redundant components. The review supports it: the data model cannot hold compound wires, multiple power types or per-view placement without a rewrite.
* **Keep both solvers, "simplified" and "detailed" modes.** Rejected in review: the user cannot tell which numbers they are seeing, and the fallback is silent. One calculation with a derived simplified view instead.
* **Keep a component-level graph, add a busbar rule.** Rejected in review: parallel wires and ports on open switches already break it. A net-based model removes the cause.
* **Port Blue Grid's engine code as is.** Rejected in review: it carries wrong-side impedance, silent defaults and Hebrew strings in logic. Port the test numbers and the structure, rewrite the maths against references.
* **One flat project list holding everything.** Rejected in review: panel layout and CAD need their own placements of the same device, and a bill of quantities needs catalog data.
* **Separate codebases per edition.** Not yet rejected. The reviewers favour one core with adapters, but the owner has not decided.
* **DWG as the CAD format.** Rejected for the first release: it needs a paid library. DXF is open and practical.

## Key Decisions & Staging for Next Steps

**Decided by the owner (carried into `/egm-draft`):**
1. Hebrew first, multilingual, no IAF relation.
2. Real numbers and calculations, not "approximate for practice".
3. Power types: AC three-phase default; AC single-phase, DC and series constant-current loops compatible.
4. Wires: compound in the single-line view by default, splittable into conductors (L, N, phases and so on).
5. Many wires on one port are allowed; the app asks whether a bus would suit better.
6. Keep most features; drop redundant and faulty components; make wires and power types more versatile.
7. Add panel schedules and layout, panel-plan export, bills of quantities, network simplification, CAD export.
8. Clean, strategically planned codebase; decide structure and features before detailed planning; plan how to add future features.
9. Several editions, to be decided together (trial, SaaS with accounts and cloud files, purchased long-term-support with local files).
10. Built by Claude Code with the owner's guidance; no deadline; Blue Grid file conversion optional.

**Open questions for the owner before `/egm-draft`:**
1. **Verification:** Will a named human electrical engineer review and sign off the reference test cases? If not, we should not claim "verifiable", and the usage policy must say what the tool does not do.
2. **Calculation scope for version 1:** Which of load flow, voltage drop, short circuit, earth-fault loop, cable sizing and protection coordination must be real in the first release, and which standards (IEC 60909, IEC 60364, Israeli regulations and editions) apply?
3. **Switching orders:** Does Flow Engine keep the switching-order generator? It was the other half of Blue Grid's purpose, but the IAF template goes. If kept, it needs a neutral, configurable template.
4. **Series constant-current loops:** Keep full support (compliance voltage, brightness steps, open-circuit trip), or only basic loops? The concept drops IAF ties but keeps airfield-style lighting; confirm that is intended.
5. **Network simplification:** Is it a Thevenin or equivalent-circuit reduction, a visual collapse, or a load-aggregation report? The reviewers assumed a derived equivalent view with traceable totals.
6. **Panel features:** Are panel schedule, panel layout, and "panel plans" three outputs or two? How physical must the layout be (module widths, DIN rows, enclosure sizes, heat)?
7. **Bill of quantities:** Does it need a priced product catalog? Who maintains it, and is it local or hosted?
8. **Phasing and cut line:** Reviewers suggest this order: model and engine with reference tests, then diagram editor, then derived views (schedules, bill of quantities, load analysis), then panel layout and CAD, then editions. Confirm or change.
9. **Technology and delivery:** Does the stack stay web plus Electron with offline use? One codebase with capability flags, or separate builds per edition?
10. **Component list from real use:** Which Blue Grid components do you or your users actually use? The triage table above came from code only.
11. **Standards profiles:** Israeli law first, IEC second, or both from day one? Cable and ampacity tables are currently hard-coded to Israeli law in the UI.

**Staging for the next step:** Answer the open questions, then run `/egm-draft` to turn this brief into `design_draft.md` (module map, dependency rules, registry interfaces, model schema outline, calculation scope, reference-test plan, phasing). Then run `/egm-review` on the draft before any code is written.

## Appendix: Reviewer Status

| Reviewer | Lens | Status |
| --- | --- | --- |
| egm-design | Architecture and risk | completed |
| egm-codebase-details | Component and code audit | completed |
| egm-zoom-out | Scope and strategy | completed |
| egm-comprehension | Cold read of the concept | completed |
| egm-implementation-readiness | Decisions needed before planning | completed |
| egm-structural | Module boundaries | completed |
| egm-inventive-catalyst | Contradictions | completed |
| Domain: electrical engineer and electrician | Engine correctness, missing features, verification | completed |
| Domain: UX and visual design | Usability, design system, RTL, accessibility | completed |
| Domain: senior developer | Code health, reuse, tooling | completed |

Limits of this review: all ten read code and did not run it (`node_modules` is absent). Engine findings marked "by reading" need confirmation by tests. The three domain reviewers are an addition to EGM's seven standard lenses, added to cover the owner's team (electrical users, UX and design, development). EGM's brainstorm table also names cost, migration and observability lenses. They were not run as separate reviewers. Observability came up only through the codebase and electrical reviews, and migration only as the optional Blue Grid converter, so treat those two as lightly covered.
