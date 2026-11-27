# Flow Engine

*   **Author:** Elad Haviv (owner), drafted with Claude Code
*   **Status:** Proposed
*   **Date:** 2026-11-27

--------------------------------------------------------------------------------

## Overview

Flow Engine is a program for electricians and electrical engineers. They draw a single-line diagram of a power network, check the electrical results, and produce the documents that go with it: switching orders, circuit schedules, bills of quantities, and CAD drawings.

It replaces Blue Grid, an earlier program by the same author. Blue Grid grew by adding features one at a time, often with different AI tools, until its structure could no longer take new requirements. Flow Engine is a new codebase that keeps Blue Grid's useful ideas and test numbers and rebuilds everything else on a planned structure.

Three properties set it apart from Blue Grid:

1.  **Numbers an engineer can check.** Every result can show its formula, its inputs, the standard clause behind it, and which values were assumed. Each calculation is tested against published reference cases.
2.  **A model that matches how the network is wired.** Wires that meet at a point form one electrical node. A wire carries a list of conductors and can be shown as one line or split into its conductors.
3.  **A program that teaches its own rules.** When a user does something the tool cannot handle well, it says why in the place where the action happened and offers a fix.

One project model feeds every view: the diagram, circuit schedule, panel layout, bill of quantities, load analysis and the simplified network. No view keeps its own copy of the data.

The program is Hebrew first, with English as the second language, and has no connection to any organisation. Israeli law is the default standards profile, with IEC as a second profile. Several editions (trial, long-term-support with local files, and a subscription edition with accounts and cloud files) will share one core. Their contents and prices are decided later.

### Decisions carried from the concepts brief and the owner

*   The owner is a human electrical engineer and reviews the reference test cases.
*   Power types: AC three-phase is the default. AC single-phase, DC and series constant-current loops are fully supported.
*   The switching-order generator stays, with a neutral template.
*   Network simplification means two features: load aggregation and a visual collapse of part of the diagram. Both are views over the full calculation.
*   The first set of components is: grid, generator, breaker, busbar, transformer, disconnector, earthing disconnector, load. The component list later grows to about 20 to 24 types, plus an annotation layer.
*   Build order, accepted by the owner: foundations, then engine and model with no screen, then editor, then documents (first release), then extended components and series loops, then panel layout, then editions.
*   Technology, accepted by the owner: TypeScript throughout, React with Vite, a monorepo of layered packages, the engine in a worker, the app runs in the browser by default, with an Electron desktop wrapper possible later (owner decision, 2026-11-27), and the owner tests every phase on a deployed build in the owner's Coolify.

### Decisions made while drafting

On 2026-11-27 the owner asked Claude to resolve the open questions below with its own suggestions. These are proposals recorded as decisions. Each states how it could fail, so a reviewer can challenge it. The owner can reverse any of them.

*   **Circuit entity.** A circuit is a first-class entity in the model. It has an ID, a panel, a way number, a phase assignment, and an ordered list of the devices and the cable it contains. A device may appear in more than one circuit, because a shared residual-current device serves several ways. The tool suggests one circuit per device by following the network downstream of a protective device up to the next protective device, and the user can edit it. *Fails if:* a shared device makes the schedule and the bill of quantities count it twice. Both count each device once by ID, and a test covers a shared device.
*   **Busbar suggestion threshold.** The suggestion appears at three or more wires on one terminal. Two wires form a plain junction. The model itself has no limit. The owner confirmed three at finalization, when the draft was checked against the concepts brief, which says the app asks when multiple wires share a port without giving a number. *Fails if:* users find the threshold too early or too late. The value is a setting and the dismissals are logged during first-use tests.
*   **Standards editions.** A project stores a standards profile ID and edition (for example Israeli law and IEC). Tables and rules are versioned data. A manifest created in Phase 0 pins the editions for version 1. The owner chose the latest edition available when Phase 0 starts. The manifest records the edition and the date it was taken. *Fails if:* a project must be recalculated under a newer edition. The project then keeps its pinned edition and shows a visible "newer edition available" notice, and recalculation is an explicit action.
*   **File format.** One JSON document per project with a schema version, stable IDs, validation on load, and an ordered chain of migrations. The document holds the event log (the saved project) and its snapshots. Unknown or invalid data is reported to the user and never deleted. Local files and cloud storage use the same document. Cloud revision data sits outside the document. *Fails if:* projects grow too large for one document. The format then needs a split into parts, which a schema version can introduce.
*   **Offline licence check.** The long-term-support edition checks a signed licence file with a public key on the user's device, and needs no network. The trial uses a signed, time-limited token and size limits. *Fails if:* a user changes the system clock or shares a file. The design does not try to stop this. How far to defend is a business decision.
*   **Diagram label direction.** The diagram's drawing space is left to right, as in electrical practice. Every label is wrapped in a bidirectional isolate so mixed Hebrew and Latin text displays correctly. Numbers and units always read left to right. The user-interface chrome mirrors with the language. *Fails if:* labels collide or reorder wrongly inside SVG. A Phase 2 prototype with real Hebrew project labels checks this before the editor is built.
*   **First-use target.** Under ten minutes, tested with at least five people who have never used the tool. This is the exit test for Phase 2.
*   **Reference test cases.** Four sources: worked examples from IEC TR 60909-4, standard IEEE test networks, cross-checks against the open-source solver pandapower (proposed tolerances: 1 percent for fault current and 0.1 percent for voltage drop), and hand calculations. The owner reviews all cases. Israeli-law cases are hand-checked by the owner. *Fails if:* an outside source disagrees with the owner's hand calculation. The case is then recorded as an open dispute with both calculations and is not silently resolved.
*   **Product name.** "Flow Engine" stays the working name. One web search found no single-line-diagram software with that name. ETAP, EasyPower and elec calc appeared instead. That search is not a trademark or domain check. The owner decided no further check is needed.
*   **Unbalanced analysis.** Version 1 gives neutral and per-phase results as a balanced-model estimate, labelled as such. Full unbalanced analysis is outside version 1. *Fails if:* a user must size a neutral conductor from the result. The label tells them it is an estimate, and the full method becomes a separate decision (see Alternative K).
*   **Cloud conflict rule.** The first subscription edition allows one editor per project at a time, with a project lock. Merging commands from simultaneous editors comes later. *Fails if:* teams need simultaneous editing at launch. The event log keeps that path open.
*   **Snapshots and compaction.** A snapshot is written at every save and after every 200 commands. Compaction is offered, never automatic, when a file passes 20 MB. These numbers are starting values, to be measured in Phase 0. *Fails if:* opening a large project is still slow, which means the interval is too long.
*   **Zero-sequence data.** The catalog stores zero-sequence values for transformers by vector group and for cables from typical ratios in the standards tables. The user can override them. A device with no data produces a fault result marked incomplete, and never an assumed value. *Fails if:* a typical ratio is wrong for a real cable. The result then shows its origin as "typical", so the engineer sees it.
*   **Standards table entry.** The owner enters standards values as numbers with their source tags. No standard text is copied into the project. The tables are checked by the owner. A legal check of what may be stored and distributed is needed before any commercial release. This is not legal advice.
*   **Bill of quantities pricing.** The owner holds no Dekel licence. The design therefore uses user-imported price lists and manually entered prices. The Dekel chapter structure is an optional template with labels only and carries no prices. Supplier catalog connectors are not needed for version 1.
*   **Israeli-law reference cases.** The owner, as a human electrical engineer, hand-checks them for version 1. A second Israeli engineer is a condition for any public claim of verification.
*   **Licence tampering.** The long-term-support edition does not defend against clock changes or shared licence files beyond the signed file.

## The Problem

Blue Grid works as a switching and fault rehearsal tool, but it cannot become the tool its author now needs.

**The numbers cannot be trusted as real.** A review of its code found these problems. Items marked "by reading" were found in the source and not executed.

*   Transformer impedance appears to be computed at the primary voltage and then added to a chain already converted to the secondary voltage (by reading: `simulation/physics/registry.ts`, `simulation/VoltagePropagation.ts`). For a 22 kV to 0.4 kV unit this would understate fault current by a large factor.
*   Short-circuit current uses the single shortest path from one source, and the breaking capacity of a device is displayed but never compared with it.
*   Protection trips any device the moment current passes its rating. There are no time-current curves, so every device upstream of a fault trips together.
*   Missing inputs are filled with defaults (cable 1.5 mm² and 100 m, 22000 V, 400 V, 50 Hz) without telling the user.
*   Two solvers run side by side, and one silently takes over for mixed AC and DC networks and constant-current loops.
*   The 187 existing test cases mostly check that the code agrees with itself. One fault test only asserts that the result is above zero.

**The model cannot hold what the author now wants.**

*   One flat property bag with 100 to 140 optional fields serves all 40 component types.
*   A wire is a single link with one cross-section. There is no conductor list.
*   Phases are encoded in port numbers.
*   The engine walks from component to component, not from node to node. Parallel wires between the same two components collapse to one, and a load wired to the supply side of an open breaker is not energised. Users meet this as a rule nobody wrote down: "you need a busbar".
*   Screen position is stored on the electrical component, so a panel layout and a CAD drawing cannot place a device differently from the diagram.
*   The saved file has no schema version.

**The interface does not teach.** Every new wire gets a hidden default cable. Errors are browser alert boxes. Linking components uses a hidden mode. Switching from Edit to Sim swaps both side panels and clears the simulation. Colour carries several meanings at once, so an energised phase looks like a fault. Direction (right-to-left) is patched by hand in over a dozen places, and Hebrew text sits inside engine logic in over 100 files.

**The code carries the cost of its growth.** Several components have two copies of their physics where the older one is dead. Component types are compared by name in well over 100 places. Three files hold 938, 1,410 and 812 lines. There is no continuous integration, TypeScript is not strict, and the git history is a single commit.

**The requested features have no place to land.** Panel schedules, panel layout, bills of quantities, CAD export and simplified networks all need a model with circuits, catalog data, measured cable lengths and per-view placements. Blue Grid has none of these.

The proposed solution is a new codebase organised in layers, with an engine that works without a screen, a model built around nodes and conductor lists, and verification built in from the start.

## Goals

Each goal is tagged with the delivery phase where it must be met. Phases are defined in the Technical Plan.

1.  **Verifiable numbers (Phase 1).** For every calculation in scope, each displayed result carries a calculation trace and an "assumed" flag, and has reference cases with published or independently computed answers. A release is blocked until the owner has signed off the reference set. At least part of the reference set comes from outside the code and the owner (published standard examples, or an open-source solver).
2.  **No silent defaults (Phase 1).** If an input needed for a calculation is missing, the engine reports a named diagnostic and does not compute with a guess. The user can accept a stated default, and the result then shows that it was assumed.
3.  **Node-based topology (Phase 1).** Any number of wires may share a terminal. Wires that meet form one node. A rule suggests a busbar when a terminal carries three or more wires (a setting, default three), and offers to insert it. The user can dismiss the suggestion for that terminal. The rule never blocks the user.
4.  **Compound wires (Phase 1 model, Phase 2 view).** A cable owns an ordered list of conductors. Which conductors exist depends on the power system (for example L1, L2, L3, N, PE for three-phase, or plus and minus for DC). The diagram shows one line by default and can expand it into its conductors. Expanding changes the view and not the data.
5.  **Four power types (Phase 1, series loops in Phase 4).** AC three-phase, AC single-phase, DC and series constant-current loops each have their own solver. Converters (transformer, rectifier, inverter, frequency drive) are explicit boundaries between regions of different type. No fallback solver exists. A case that cannot be solved produces a visible diagnostic.
6.  **Calculation scope, first gate (Phase 1).** Load flow with real and reactive power, voltage drop, short circuit per IEC 60909 (maximum, and minimum phase-to-earth), cable sizing, and earth-fault loop with disconnection time.
7.  **Calculation scope, second gate (Phase 4).** Protection with time-current curves and selectivity between devices, and series constant-current loops with compliance voltage, brightness steps, open-circuit behaviour and a closed-loop check.
8.  **Standards profiles (Phase 1).** Israeli law is the default profile and IEC is the second. Tables and rules live in a standards data layer, tagged with their source clause, and separate from the user interface.
9.  **A first-time user succeeds without help (Phase 2).** A person who has never used the tool can place a source, a breaker and a load, connect them, energise the network and read a result. The target is under ten minutes in a test with at least five such users. The tool teaches its rules with in-place hints, a problems panel with a one-click fix for each entry, and a first-run guide that does not delete the user's work. *(The target and the user count were proposed by Claude and adopted on the owner's delegation. The owner can change them.)*
10. **One persistent layout (Phase 2).** Edit and simulate share one screen layout. Simulation overlays results on the diagram and never discards edit state.
11. **Hebrew first, multilingual (Phase 2).** All user-facing text comes from message catalogs. The engine returns codes with parameters. Layout uses logical directions, and mixed Hebrew and Latin text displays correctly, including inside diagram labels. English is the second language.
12. **Documents from the model (Phase 3).** Switching order (neutral template), circuit schedule, bill of quantities, and a DXF export of the diagram. All are generated from the project model and each has golden-file tests.
13. **Core component set (Phase 1), then growth (Phase 4).** Grid, generator, breaker, busbar, transformer, disconnector, earthing disconnector, load first. Then the remaining types, merged from Blue Grid's 40 into about 20 to 24, plus an annotation layer.
14. **Network simplification (Phase 4).** Load aggregation and visual collapse as views over the full calculation. Each folded node lists what it contains, and its totals are checked against the full result.
15. **Panel layout and plan export (Phase 5).** Devices on DIN rails by module width, with enclosure sizes, and the layout exported as DXF. Heat calculations are not included.
16. **Structure that resists patching (Phase 0).** Layered packages with import rules checked in continuous integration. Strict TypeScript. A file length limit. One written spec per feature, and short decision records for architecture choices. A rule that behaviour is reached through registries and never through type-name checks.
17. **Edition-ready core (Phase 0 interfaces, Phase 6 editions).** Storage, identity, licensing and the desktop shell sit behind interfaces. Edition differences are a data-driven capability list. No engineering code knows which edition runs it.
18. **Browser first, testable at every phase (Phase 0).** The app runs in the browser by default and needs no installation. A Docker build serves it as static files. Each phase ends with a build deployed to the owner's Coolify at a test address, so the owner can try it between sessions. Electron is a later, optional wrapper and no feature may depend on it.

## Non-Goals

*   Accounts, billing and cloud storage in the first release. Only the interfaces are designed.
*   DWG export. DXF only.
*   Transient and dynamic simulation, motor starting, harmonics, power-factor correction design, generator droop, and arc-flash analysis.
*   Heat calculation in panel layouts.
*   Bundling any price list or product catalog. Prices come from lists the user imports.
*   Opening Blue Grid files inside the core. A separate converter may follow later.
*   Editing on phones. A read-only phone view may follow later.
*   Fixing the contents and prices of editions. Only the mechanism for them is built.
*   Server-side calculation. The engine runs on the user's device.
*   An Electron desktop wrapper before the browser release. The browser build is the default and Electron may follow.
*   Full unbalanced three-phase analysis in version 1. Neutral and per-phase results are estimates.
*   Simultaneous multi-user editing in the first subscription edition. One editor per project at a time.

## Open Questions

None at this time. Questions raised by later review are added here.

## Critical User Journeys (CUJs)

### CUJ 1: First feeder by a new user

*   **Given**: A person who has never used Flow Engine opens it for the first time with an empty project.
*   **When**: They follow the first-run guide, place a grid source, a breaker and a load, connect the terminals, and add a second load to the same breaker terminal.
*   **Then**: Each wire is created with a visible default cable that the tool names, the second load triggers an in-place suggestion to insert a busbar, and accepting it rewires the connection. The user runs the simulation and reads the load's voltage and current. No dialog box blocks them.

### CUJ 2: Checking a number

*   **Given**: A simulated network with a transformer, a cable and a load.
*   **When**: The engineer clicks the voltage drop at the load.
*   **Then**: A panel shows the formula, the input values with their sources, the standard clause, and a flag on any assumed value. The same panel is part of the exported calculation report.

### CUJ 3: Splitting a wire into conductors

*   **Given**: A three-phase cable shown as one line, labelled with its form and size.
*   **When**: The engineer expands it and sets a different cross-section for the PE conductor.
*   **Then**: The line fans out into L1, L2, L3, N and PE in the standard colours. The cable properties show the shared values and list the PE difference. The simulation and the bill of quantities use the per-conductor data, and collapsing the wire restores the single line without changing any data.

### CUJ 4: Switching order from a rehearsal

*   **Given**: A network with a main breaker, a feeder, a disconnector and an earthing disconnector.
*   **When**: The engineer simulates isolating the feeder for work, with lock-out, and generates a switching order.
*   **Then**: A document lists the operations in order with their checks, uses the project's language and a neutral template, and can be printed or exported.

### CUJ 5: Documents from one model

*   **Given**: A complete project with devices, cables and circuits.
*   **When**: The engineer generates the circuit schedule, the bill of quantities and a DXF export.
*   **Then**: All three come from the same model. A change to a breaker rating changes all three. The bill lists unpriced and unspecified items clearly, and every quantity links back to its source elements.

### CUJ 6: A series lighting loop

*   **Given**: A series circuit fed by a constant-current regulator, with a number of lamp transformers in series.
*   **When**: The engineer opens one lamp circuit and runs the simulation.
*   **Then**: The tool reports the loop as open, shows the regulator's response according to the model, and lists which lamps are affected. Nothing falls back to another solver.

## Technical Plan (Architecture)

### Approach in one paragraph

Flow Engine is built as layered packages. The bottom layers (model, catalog, engine) contain no screen code and run in a worker or in tests. Views turn the model into documents and drawings. The editor and interface sit on top. Editions are thin shells that choose adapters. The saved project is an append-only log of commands. The engine solves each power type with its own solver. A drawing description sits between the model and the two renderers, so the diagram, the exports and the tests all read the same thing.

### Architecture decisions made by the author

These five were chosen through single-select gates on 2026-11-27. Options and trade-offs are in the Alternatives section.

| Decision | Choice | What it requires | How it could fail |
| --- | --- | --- | --- |
| Solver | One solver per power type, converters as explicit boundaries | A boundary-iteration rule with an iteration cap and a visible failure diagnostic. A plan for unbalanced loads (see Engine). | Boundary iteration oscillates in networks with many converters. |
| Topology | Nets derived from terminals and wires; a junction record is stored only when a connection point is made explicit | Conversion between implicit and explicit forms keeps connectivity identical, with a test for it. Events refer to terminals, wires and junctions, never to nets. | The two forms disagree about connectivity. |
| Edits | The event log is the saved project | Versioned command types, migration of old commands, periodic snapshots, and a compaction rule. | A command's meaning changes between versions and replay gives a different model. |
| Rendering | SVG at working zoom, canvas when zoomed out or for heavy overlays | One drawing description feeds both renderers, with image tests at the zoom handover. | The renderers drift and a diagram looks different at different zoom levels. |
| Numerics | In-house numeric core: complex numbers and matrix solving inside `engine` | A dense solver first, a sparse variant when large projects need it, and tests against reference matrices. A condition check that reports floating nodes. | A numerical bug survives because the reference matrices miss its case, or large projects outgrow the dense solver before the sparse one exists. |

Technology accepted earlier by the author: TypeScript throughout, React with Vite, a monorepo of layered packages, the engine in a worker, the app runs in the browser by default and Electron may come later (owner decision, 2026-11-27).

### Layers and dependency rules

A layer may import only from layers listed as its allowed imports. Continuous integration fails the build on any other import.

| Layer (package) | Purpose | Allowed imports |
| --- | --- | --- |
| `model` | Project schema, IDs, units, event-log command types, migrations, validation | nothing |
| `catalog` | Device kinds (ports, ratings, rules), cable types, standards tables with clause tags | `model` |
| `engine` | Net derivation, solvers, protection, cable sizing, short circuit, diagnostics, calculation trace, switching-order logic, load aggregation | `model`, `catalog` |
| `views` | Functions from model and results to circuit schedule, bill of quantities, panel layout, load analysis, simplified view | `model`, `catalog`, `engine` |
| `scene` | The drawing description: shapes, text runs, layers, per-view placements | `model`, `catalog`, `views` |
| `symbols` | Device drawings keyed by catalog ID | `catalog` |
| `io` | Exporters and importers: DXF, spreadsheet, document, PDF, Blue Grid converter | `model`, `catalog`, `views`, `scene` |
| `i18n` | Message catalogs, number and unit formats, direction rules | nothing (all layers may import it) |
| `editor` | Commands, selection, tools, rules that advise the user | `model`, `catalog`, `engine`, `views`, `scene`, `platform` interfaces |
| `ui` | React components, SVG and canvas renderers, forms generated from catalog schemas | everything above except platform adapters |
| `platform` | Interfaces for storage, file dialogs, identity, licence, telemetry | `model` |
| `editions` | Composition roots: wire adapters and capability sets into an app | everything |

Further rules:

*   The engine never imports React, the DOM or any platform code.
*   No user-facing text exists outside message catalogs. A lint rule enforces it.
*   Behaviour is reached through registries (devices, power types, advice rules, views, exporters). No code compares a device type name, except inside that device's own definition.
*   Branding and edition names appear only in `editions` and `i18n`.
*   A source file is limited to 300 lines. TypeScript runs in strict mode and `any` is an error.

```text
        user actions
             |
        [ editor ] --- commands --->  [ event log ]  (saved project)
             |                              |
             |                         replay / snapshot
             v                              v
        [ ui: SVG + canvas ] <--- [ scene ] <--- [ model (current state) ]
                                      ^                |
                                      |                v
                              [ views ] <------- [ engine (worker) ]
                                  |                    |
                                  v                    v
                           [ io: DXF, XLSX, PDF ]   diagnostics + traces
```

### Project model

The model holds three kinds of data and keeps them apart.

1.  **Electrical network.** Terminals and devices, cables with conductor lists, explicit junctions, circuits, panels and ways.
2.  **Catalog references.** A device points to a catalog kind and, optionally, to a classified item (a class and attributes, plus a part number if the user has one).
3.  **Placements.** Each view has its own placements of the same devices: diagram, panel layout, and later others. A placement is a position, rotation and size that belongs to the view and not to the device.

Runtime results (voltages, currents, trip states, simulation time) are never part of the saved project.

| Entity | Key data |
| --- | --- |
| Device | ID, catalog kind, parameters checked against that kind's schema, terminals |
| Terminal | ID, owning device, role (for example input, output, earth), allowed conductor roles |
| Cable | ID, ordered conductor list (role, cross-section, material, insulation), length, installation method, catalog item |
| Wire | ID, two endpoints (a terminal or a junction), the cable it belongs to |
| Junction | ID, optional name and rating. Stored only when explicit. |
| Circuit | ID, panel, way number, phase assignment, ordered devices and cable |
| Panel | ID, name, enclosure, rails, ways |
| Placement | View ID, entity ID, position, rotation, size, waypoints |
| Annotation | Text, shapes and arrows on a separate layer, with no electrical meaning |

**Units.** Quantities store a value with a unit. Calculations convert at the boundary of the engine and use one internal system.

**Identity.** IDs are generated, stable and never reused. Nothing is identified by a label.

### The event log

The saved project is a list of commands. Each command has a type, a version, a time and an author field, and refers only to stable IDs.

*   **Replay.** The current model is the result of applying the commands in order.
*   **Snapshots.** The file also holds snapshots at intervals, so opening a large project does not replay everything. A snapshot is a cache and can be rebuilt from the log.
*   **Undo.** Undo appends a compensating command. History shows both the original and the undo.
*   **Migration.** When a command's meaning changes, a migration rewrites old commands to the new form. A fixture file per version tests that replay of an old log gives the expected model.
*   **Compaction.** The user can compact history. Compaction replaces a span of commands with their net effect, and the original log is kept until the user confirms. The default never compacts silently.
*   **Cloud.** The same log is the unit of sync. Conflicts are resolved at command level. The rule is open (see Open Questions).

### Topology and the busbar rule

*   Terminals and wires are stored. The engine derives nets, which are sets of terminals joined by wires.
*   Several wires on one terminal are allowed and join one net.
*   A junction record is created when the user names or rates a connection point, or accepts the busbar suggestion.
*   The busbar suggestion is an advice rule (see Editor). It appears at three or more wires on one terminal. It offers to insert a busbar with a rating, and the user can dismiss it for that terminal.
*   A busbar is a device with a catalog kind. It has terminals, a rating and a length, and appears in the bill of quantities. A plain junction has no cost.

### Catalog and standards layer

*   One catalog record per device kind: terminals, parameters with units and ranges, which power types it works in, which behaviours it provides (switching, protection, conversion), and the rules it follows. Its drawing is a separate asset in `symbols`, found by catalog ID. A test fails when a kind lacks either.
*   Cable types and conductor data come from standards tables, each value tagged with its source (standard, edition, clause or table).
*   A **standards profile** (Israeli law, IEC) is a named set of tables and rules. A project records the profile and edition. A manifest pins the editions for version 1.
*   Zero-sequence data (needed for unbalanced faults) lives in the catalog for transformers and cables. A device without it is flagged and its fault results show as incomplete.
*   User-added kinds and cable types are allowed. They are marked as user data in every result that depends on them.

### Engine

**One solver per power type.** Each region of the network that has one power type is solved by its own solver. A transformer, rectifier, inverter or frequency drive is a boundary between regions.

| Solver | Method | Notes |
| --- | --- | --- |
| AC three-phase | Balanced positive-sequence load flow: sweep for radial networks, iterative for meshed | The default. Includes real and reactive power. |
| AC single-phase | Same method with two-wire paths | Includes single-phase supplied from a three-phase network. |
| DC | Resistive network with sources and loads | Battery internal resistance and photovoltaic limits are modelled as source characteristics. |
| Series constant-current loop | Loop solution with a current-source regulator | Compliance voltage, brightness steps, open-circuit detection and a closed-loop check. |

**Boundaries.** Regions exchange voltage and power at converters. The solver repeats until the boundary values agree within a stated tolerance or reaches an iteration cap. If the cap is reached, the engine reports a diagnostic that names the boundary and shows the last values. It never keeps old results as if they were current.

**Short circuit.** IEC 60909 with sequence networks for three-phase, phase-to-phase and phase-to-earth faults. Contributions from all sources and parallel paths are included. Results include the peak and the breaking current. A device's breaking capacity is compared with the fault current at its location.

**Protection.** Devices carry time-current characteristics. The engine reports tripping times and a selectivity verdict between each device and the one upstream of it. Phase 4.

**Cable sizing and earth-fault loop.** Cable sizing uses the standards tables and correction factors for the chosen profile. The earth-fault loop check uses the device characteristic, the earthing system and the disconnection-time limit of the profile.

**Unbalanced loads on a balanced solver.** The balanced solver gives positive-sequence results. Single-phase loads on a three-phase network are allocated to phases, and the engine reports per-phase currents and neutral current as an estimate derived from the balanced result. These results carry a label "balanced-model estimate" and do not claim to equal a full unbalanced solution. This is a known limit of the chosen solver design.

**Diagnostics.** Every problem is a structured diagnostic: a stable code, severity, the affected entity IDs, and parameters. Text is made at the edge from message catalogs. Missing inputs produce a diagnostic and no result.

**Calculation trace.** Each result stores its formula identifier, the input values with their origin (entered, catalog, standard, assumed), the standard and clause, and an assumed flag. The interface and the exported calculation report read this.

**Worker.** The engine runs in a worker with a message protocol that coalesces rapid requests and drops stale results. Input is an immutable snapshot of the derived network, and output is structured data.

**Switching-order logic.** The engine checks each simulated operation against interlocks and lock-out, and records the operation list that the document view turns into a switching order.

**Simplification.** Load aggregation sums loads per node or section with their phases and power factors. The visual collapse hides part of the diagram behind a labelled block. Both are views over the full calculation, list what they contain, and check their totals against the full result.

### Views and documents

*   Each view is a function from the model and engine results to a view-model. No view stores its own copy of project data.
*   **Circuit schedule** and **bill of quantities** are derived from circuits, devices and cables. The bill follows `docs/research/boq_options.md`: quantities derived, item identity from an open classification, prices from user-imported lists, unpriced and unspecified items listed.
*   **Switching order** comes from a recorded simulation sequence and a neutral, editable template.
*   **Panel layout** (Phase 5) places devices on rails by module width, in an enclosure, with its own placements.
*   Selection is shared across views by entity ID.

### Rendering and drawing description

*   The `scene` layer turns the model, placements and results into a drawing description: shapes, text runs with direction, layers, and hit regions.
*   The SVG renderer draws the visible area at working zoom. The canvas renderer takes over when zoomed out beyond a set level, or for heavy overlays such as animated current. A spatial index limits what each renderer draws.
*   Both renderers read the same description, so they cannot disagree about what to draw. Image tests compare them at the handover zoom.
*   DXF, PDF and printed output are made from the drawing description, not from either renderer.
*   Text runs carry their direction. Every label is a bidirectional isolate. Numbers and units read left to right. A Phase 2 prototype checks real Hebrew project labels before the editor is built.

### Editor behaviour

*   **Commands are the only write path.** A tool, a form field or a paste produces commands. Nothing writes to the model directly.
*   **Advice rules.** An advice rule inspects the model and returns messages, each with a stable rule ID, an explanation, and a fix action. The busbar suggestion, missing protection, undersized cable, mixed voltage on a terminal, and open loops are rules. The user can dismiss a rule per element or per project.
*   **Problems panel.** All diagnostics and advice appear in one panel, with severity, text, and a click that selects the element. It replaces alert boxes.
*   **One layout.** Edit and simulate share one screen. Simulation overlays values and colours on the diagram and never clears edit state or the log.
*   **Visible modes.** A linking or drawing mode always shows a banner with the next valid action and how to cancel.
*   **Forms from schemas.** The property panel is generated from the catalog schema of the selected device, grouped as basic, rating, protection and appearance, with units, ranges and a stated reason when a field is disabled.
*   **Design system.** Tokens for colour roles, spacing, type scale (12 px minimum), light and dark themes. Colours for electrical identity (phases, DC, earth), element state, and interface status are separate families. Red and amber are reserved for alarms.
*   **Compound wires.** A cable shows as one line with a label of its form and size. A control expands it into its conductors in standard colours, and collapses it again. Expanding changes the view only.

### Internationalisation

*   Hebrew first, English second. Message catalogs use keys with parameters.
*   Layout uses logical directions (start and end). The interface mirrors with the language. The diagram's drawing space stays left to right.
*   The engine and model return codes and IDs. Text, number formats and units are made at the edge.
*   Reports and exports use the project language and a language-specific template.

### Editions and platform

*   Storage, identity, licence and file dialogs are interfaces in `platform`. Each edition supplies adapters in `editions`.
*   Edition differences are a capability set stored as data and read through one interface. No other code tests the edition name.
*   The long-term-support edition runs offline and checks a signed licence file on the device. The trial adds a signed, time-limited token and project-size limits. The subscription edition adds accounts and cloud storage, which come last (Phase 6).
*   The engine runs on the user's device in every edition.
*   **Browser storage.** Projects open and save through a storage interface. Where the browser supports the File System Access API (Chromium-based browsers), the app reads and writes files directly. Elsewhere it uses file upload and download, with autosave in IndexedDB. The long-term-support edition can be installed as an offline-capable web app. The supported browser list is decided in the Phase 0 spec.

### Delivery phases

| Phase | Content | Exit gate |
| --- | --- | --- |
| 0 | Repository rules, `CLAUDE.md`, continuous integration with boundary and size checks, model schema, event-log core, standards manifest, a minimal browser app shell with a Dockerfile, and deployment to the owner's Coolify | The build fails on a rule violation. A project round-trips through save and load. The shell loads at its test address after each push. |
| 1 | Engine and model for the eight core components and the first calculation gate, plus reference tests, and a calculation console page in the browser (load a network file, see results and traces; no editor) | The owner signs off the reference set. Every result has a trace. |
| 2 | Editor: nets and compound wires, busbar advice, problems panel, Hebrew and English, design system | A new user wires and energises a feeder unaided in under ten minutes (five users). |
| 3 | Documents: switching order, circuit schedule, bill of quantities, DXF | **First release**, local edition. |
| 4 | Remaining components, series loops, protection and selectivity, load aggregation and visual collapse | Second calculation gate passes its reference cases. |
| 5 | Panel layout and panel plan export | Layout and schedule agree on the same model. |
| 6 | Editions: accounts, cloud storage, sync, and the optional Electron wrapper | Conflict rule is decided and tested. |

### Blue Grid parity

The [parity checklist](./parity-checklist.md) lists every Blue Grid feature found in the code, the changelog and the docs (357 rows), with a proposed decision, a home in this design, and an owner column. A Blue Grid feature is part of Flow Engine only when its row says where it lives. The first release is not complete until the owner has marked every KEEP and REDESIGN row that falls in Phases 0 to 3.

### Risks and limits

*   **Real numbers is a promise.** The plan depends on reference cases from outside the code and on the owner's review. Without both, "verifiable" cannot be claimed.
*   **Balanced solver limit.** Unbalanced and neutral results are estimates. Users who need full unbalanced analysis will not get it until a later decision.
*   **Boundary iteration.** Networks with many converters may fail to converge. The cap and the diagnostic are mandatory, and a test network with many converters is part of the reference set.
*   **Event log growth.** Without compaction, files grow with every edit. Without migration discipline, old files stop opening. Both are tested from Phase 0.
*   **Cloud merging of commands** is harder than merging a document. The rule is deferred to Phase 6 and the log design must not make it impossible.
*   **Two renderers.** The risk of drift is reduced by the shared drawing description and image tests, and not removed.
*   **Scope.** The plan is large. The phase gates exist to allow stopping or cutting after any phase.
*   **Browser limits.** The File System Access API is missing in Firefox and Safari, and IndexedDB has storage quotas, so file handling differs by browser and large projects may hit quotas. A user may clear site data and lose an autosave that was never exported.
*   **Zero-sequence data** is often missing from catalogs. Fault results for unbalanced faults depend on it.
*   **Standards licensing.** The text of standards is copyrighted. The tables in the catalog must be entered and tagged by the owner or taken from permitted sources.

## Alternatives Considered

Where the author chose between options at a decision gate on 2026-11-27, the author gave no reason, so the entry says "Not selected by author" and lists the technical trade-offs without attributing them to the author. Where the owner stated a reason, the entry says "Rejected by author". Other entries were rejected in the fresh-reviewer review of the concept (the review is described in `concepts_brief.md`) or by a drafting default that the owner accepted.

### Alternative A: Patch Blue Grid in place

*   **Pros**: No new codebase. Existing users keep their files. The tested solver stays in place.
*   **Cons**: The data model cannot hold conductor lists, several power types, or per-view placements without being rebuilt. Duplicated and dead component code, type-name checks in well over 100 places, and 1,000-line files make each change riskier.
*   **Reason for Rejection**: Rejected by author: the code carries too many patches on patches, some components are faulty or redundant, and features were added without a plan. The concept review supports this on technical grounds.

### Alternative B: Keep two solvers with "simplified" and "detailed" modes

*   **Pros**: Simple results are quick to show, and existing users know the setting.
*   **Cons**: A user cannot tell which numbers they are seeing, and Blue Grid's fallback to the older solver happens silently for mixed AC and DC networks and constant-current loops.
*   **Reason for Rejection**: Rejected in review: one calculation with a derived simplified view gives traceable numbers. In the chosen design, each power type has one solver and no fallback.

### Alternative C: Keep the component-level graph and add a busbar rule

*   **Pros**: Smallest change from Blue Grid. The rule is easy to explain.
*   **Cons**: Parallel wires between the same two components collapse to one. A load wired to the supply side of an open breaker is not energised. The rule would hide these faults and not remove them.
*   **Reason for Rejection**: Rejected in review: a net-based model removes the cause and leaves the busbar as advice about ratings and protection.

### Alternative D: Port Blue Grid's engine code as it is

*   **Pros**: Saves the time of rewriting the solver. The code is already free of screen dependencies and has a worker protocol.
*   **Cons**: It appears to compute transformer impedance on the wrong side (found by reading, not executed), fills missing inputs with defaults, produces Hebrew text inside engine logic, and mixes two solvers.
*   **Reason for Rejection**: Rejected in review: port the test numbers and the structural ideas (island decomposition, worker coalescing, trip intents), and rewrite the maths against independent references.

### Alternative E: One flat project list holding everything

*   **Pros**: Simple file. No views or placements to manage.
*   **Cons**: A panel layout, a diagram and a CAD drawing cannot place the same device differently. A bill of quantities has nowhere to keep catalog data. Blue Grid's flat bag of 100 to 140 optional fields shows the result.
*   **Reason for Rejection**: Rejected in review: the model separates the network, catalog references and per-view placements.

### Alternative F: A separate codebase for each edition

*   **Pros**: Each edition can be tuned on its own. No capability flags to maintain.
*   **Cons**: Every engine fix has to be made several times. Editions drift apart. Verification of the numbers is repeated per edition.
*   **Reason for Rejection**: Not selected by author: the owner accepted one core with edition adapters and capability flags on 2026-11-27 as a recommendation. A fully separate build becomes the better choice only if an edition needs a different engine, which nothing in the current plan suggests.

### Alternative G: DWG as the CAD format

*   **Pros**: DWG is what many CAD users expect.
*   **Cons**: It is proprietary and needs a paid library or a conversion step.
*   **Reason for Rejection**: Rejected for the first release as a drafting default that the owner accepted: DXF is open and practical. Revisit if users insist on DWG.

### Alternative H: Desktop application only, with no browser build first

*   **Pros**: Direct file access. No browser limits. Closest to how Blue Grid ships.
*   **Cons**: Testing needs an installer on every machine. A separate path is needed later for the subscription edition. Updates and trials are harder to distribute.
*   **Reason for Rejection**: Rejected by author: the app runs in the browser by default, deployed to the owner's Coolify for testing, and Electron may come later.

### Alternative I: Bundle a price list and a product catalog

*   **Pros**: Bills of quantities come out priced immediately.
*   **Cons**: Price lists are copyrighted. Manufacturer data has its own terms. Keeping prices current is a content business of its own.
*   **Reason for Rejection**: Rejected in the bill-of-quantities research (`docs/research/boq_options.md`) and listed as a non-goal. Users import price lists they have the right to use.

### Alternative J: ECLASS in place of ETIM for item classification

*   **Pros**: Widely used in German industry. Covers more than electrical products.
*   **Cons**: Licensing is mixed: some releases are free to registered users or for research, while commercial use of full releases is paid and priced by company size. ETIM is open under an attribution licence.
*   **Reason for Rejection**: Drafting default, not an owner decision: the bill-of-quantities research recommends ETIM for cost. The owner has not been asked this question separately.

### Alternatives for the four architecture decisions

#### Decision 1: how the engine solves networks

##### Alternative K: One nodal solver for all conductors

*   **Pros**: Unbalanced loads, neutral current and single-phase from three-phase need no special code. Short-circuit Thevenin impedance and a full network reduction come from the same matrix. One solver to verify.
*   **Cons**: Nonlinear loads and converters need iteration. IEC 60909 uses sequence components, so mapping the standard onto per-conductor results needs care. The hardest option to build.
*   **Reason for Rejection**: Not selected by author at the gate. It becomes the better choice if full unbalanced analysis moves into scope (see Open Questions). Floating nodes at open switches and poorly conditioned rings are its failure cases.

##### Alternative L: Balanced solver first, per-conductor module added later

*   **Pros**: Fastest to the first verified numbers. The model already stores per-conductor data.
*   **Cons**: Two calculation methods coexist after the later addition. Someone must own which result is shown and reconcile disagreements. Blue Grid's confusion over two solvers is the precedent.
*   **Reason for Rejection**: Not selected by author at the gate.

#### Decision 2: how wire connections are stored

##### Alternative M: Stored junction nodes only

*   **Pros**: What is drawn is what is stored. A junction can carry a name, a rating and a conversion action.
*   **Cons**: The editor must create, move and delete junctions correctly. Orphan and duplicate junctions are possible. Files hold more records.
*   **Reason for Rejection**: Not selected by author at the gate.

##### Alternative N: Derived nets only

*   **Pros**: Smallest model and the fewest ways to store inconsistent data.
*   **Cons**: A connection point cannot carry data of its own, such as a name or rating. Recomputing nets on every edit costs time on very large projects.
*   **Reason for Rejection**: Not selected by author at the gate. It becomes the better choice if the hybrid's two forms prove hard to keep consistent.

#### Decision 3: how edits are written and undone

##### Alternative O: Commands with hand-written reverse

*   **Pros**: Simple and well understood. Readable history.
*   **Cons**: Every command needs a correct reverse, and a missed side effect makes undo restore a different state.
*   **Reason for Rejection**: Not selected by author at the gate.

##### Alternative P: Commands that produce patches

*   **Pros**: Reverse is derived by a library. Small updates suit cloud sync.
*   **Cons**: Depends on a patch library. Patches are harder to read than named commands. Data the library cannot track is missed.
*   **Reason for Rejection**: Not selected by author at the gate. It becomes the better choice if event-log migration proves too costly.

#### Decision 4: how the diagram is drawn

##### Alternative Q: SVG elements only

*   **Pros**: The same approach as Blue Grid. The browser handles Hebrew and mixed-direction text, keyboard focus and styling. Printing and vector export are direct.
*   **Cons**: Thousands of elements slow panning and zooming, even with culling. Blue Grid already needed culling and an animation cut-off.
*   **Reason for Rejection**: Not selected by author at the gate. It becomes the better choice if the two renderers prove too costly to keep identical.

##### Alternative R: Canvas only

*   **Pros**: Smooth at large scale and for animation.
*   **Cons**: Accessibility, keyboard focus and mixed-direction text need custom work, and mistakes there are easy to miss.
*   **Reason for Rejection**: Not selected by author at the gate.

#### Decision 5: how the numeric core is provided

##### Alternative S: A maintained JavaScript numerics library

*   **Pros**: Tested numerics from the start. Less code to write.
*   **Cons**: Adds a dependency and bundle size. Complex-matrix performance varies by library. A library update can shift results slightly and break golden-file tests. Sparse support is limited.
*   **Reason for Rejection**: Not selected by author at the gate. It becomes the better choice if the in-house solver proves costly to verify.

##### Alternative T: A WebAssembly sparse solver

*   **Pros**: Speed at large scale.
*   **Cons**: Needs a native build toolchain. Harder to debug and inspect. Some well-known sparse solver components carry copyleft licences, which would need checking against the long-term-support edition.
*   **Reason for Rejection**: Not selected by author at the gate. It becomes the better choice if projects reach a size where a dense or in-house sparse solver is too slow.

## Detailed Implementation Plan

### Scope of this plan

This plan lists **every file for Phase 0 and Phase 1**, which are the next work. For Phases 2 to 6 it lists packages and key folders only. Each later phase gets its own one-page spec in `docs/specs/` before work on it starts, as the plan's own rule requires. Listing every file of later phases now would be invented detail.

**Fixed tooling choices** (single defensible answers, decided here and not asked): pnpm workspaces; the current Node LTS pinned in `.nvmrc`; TypeScript in strict mode; Vitest for tests; fast-check for property tests; zod for schema validation; dependency-cruiser for import rules; ESLint and Prettier; jscpd for duplicate code; knip for unused exports; GitHub Actions for continuous integration. IDs are time-sortable strings in ULID format, produced by one function in `model`.

**Existing files in the repository:** `concepts_brief.md` stays where it is as the record of the concept review. `docs/research/boq_options.md` stays. `design_draft.md` moves to `docs/designs/flow-engine.md` when the design is finalised (Step 6).

### Phase 0: repository, rules and model core

#### Repository root

| File | Action | Rationale |
| --- | --- | --- |
| `package.json` | Create | Workspace root. Scripts: `build`, `typecheck`, `lint`, `test`, `test:reference`, `depcheck`, `dupcheck`, `unused`. Pins the Node range. |
| `pnpm-workspace.yaml` | Create | Declares `packages/*` and `apps/*` as workspaces. |
| `.nvmrc` | Create | Pins the Node LTS so every machine and the CI build the same way. |
| `.npmrc` | Create | Exact versions only and strict peer dependencies, so a dependency update cannot change a verified number unnoticed. |
| `tsconfig.base.json` | Create | Strict mode, unchecked-index and exact-optional checks, project references. Includes test folders, which Blue Grid left unchecked. |
| `eslint.config.js` | Create | Errors on `any`, files over 300 lines, high complexity, DOM globals inside `model`, `catalog` and `engine`, string literals in user-facing code, and device-kind comparisons outside `catalog`. |
| `.prettierrc.json`, `.editorconfig`, `.gitignore` | Create | One formatting standard for people and for Claude Code sessions. |
| `.dependency-cruiser.cjs` | Create | Encodes the layer table of the Technical Plan. A forbidden import fails the build. |
| `vitest.workspace.ts` | Create | Runs the tests of every package, including property tests. |
| `scripts/check-markers.mjs` | Create | Fails when a TODO, "legacy" or "deprecated" marker has no issue number next to it. |
| `.github/workflows/ci.yml` | Create | Runs typecheck, lint, import rules, duplicate and unused-code checks, unit and property tests, reference tests, and the coverage gate on every change. |
| `.github/pull_request_template.md` | Create | Asks for the spec link, the module changed, what was deleted, and which tests prove it. |
| `CLAUDE.md` | Create | Short and binding. States the layer map and import direction, the 300-line limit, "edit the owning module and never add a second implementation", "no global state, no window events, no `any`, no defaults for engine inputs", the spec-first rule, and where decisions are recorded. |
| `README.md` | Create | What Flow Engine is, how to build and test, where the design and decisions live. |

#### Documentation

| File | Action | Rationale |
| --- | --- | --- |
| `docs/designs/README.md` | Create | Index of designs, so the finalised design is registered. |
| `docs/designs/flow-engine.md` | Create (moved from `design_draft.md`) | The approved design that the phases implement. |
| `docs/adr/README.md` | Create | Explains the decision-record format and numbering. |
| `docs/adr/0001-layered-packages.md` | Create | Records the layers and import rules. |
| `docs/adr/0002-solver-per-power-type.md` | Create | Records Decision 1 with its failure conditions. |
| `docs/adr/0003-hybrid-topology.md` | Create | Records Decision 2. |
| `docs/adr/0004-event-log-as-project.md` | Create | Records Decision 3. |
| `docs/adr/0005-hybrid-rendering.md` | Create | Records Decision 4. |
| `docs/adr/0006-in-house-numeric-core.md` | Create | Records Decision 5. |
| `docs/specs/TEMPLATE.md` | Create | One-page feature spec: data model change, packages touched, tests first, what is deleted. |
| `docs/verification/README.md` | Create | Defines the reference-case sets, tolerances and how sign-off works. |
| `docs/verification/signoff.md` | Create | A log where the owner records review of each reference set, with date and any disputes. |

#### Package `packages/model`

| File | Action | Rationale |
| --- | --- | --- |
| `package.json`, `tsconfig.json` | Create | Package definition. Imports nothing from the project. |
| `src/index.ts` | Create | Public API of the package. Nothing else is importable from outside. |
| `src/ids.ts` | Create | Branded ID types and one generator. IDs are stable and never reused. |
| `src/units.ts` | Create | A quantity is a value plus a unit. Conversion to the engine's internal system happens only here. |
| `src/diagnostics.ts` | Create | The structured diagnostic shape and the list of stable codes, shared by engine and interface. |
| `src/schema/project.ts` | Create | Project root: ID, name, language, standards profile and edition, schema version. |
| `src/schema/device.ts` | Create | Device entity: catalog kind ID, parameters, terminal IDs. Parameters are checked against the kind's schema. |
| `src/schema/terminal.ts` | Create | Terminal: owning device, role, allowed conductor roles. |
| `src/schema/cable.ts` | Create | Cable with an ordered conductor list (role, cross-section, material, insulation), length and installation method. |
| `src/schema/wire.ts` | Create | Wire: two endpoints (terminal or junction) and its cable. |
| `src/schema/junction.ts` | Create | Explicit junction, with optional name and rating. |
| `src/schema/circuit.ts` | Create | Circuit: panel, way, phase assignment, ordered devices and cable. |
| `src/schema/panel.ts` | Create | Panel, enclosure and ways. |
| `src/schema/placement.ts` | Create | Per-view placement of an entity: position, rotation, size, waypoints. |
| `src/schema/annotation.ts` | Create | Annotation layer: text, shapes, arrows, with no electrical meaning. |
| `src/events/command-types.ts` | Create | The versioned command types. Every command refers only to IDs. |
| `src/events/apply.ts` | Create | Pure function: model plus command gives the next model, or a rejection with a diagnostic. |
| `src/events/log.ts` | Create | The append-only log: append, replay, undo as a compensating command. |
| `src/events/snapshot.ts` | Create | Writes and reads snapshots. A snapshot is a cache and can always be rebuilt from the log. |
| `src/events/compaction.ts` | Create | Replaces a span of commands with their net effect only on explicit request, and keeps the original until confirmed. |
| `src/events/migrations/index.ts` | Create | Ordered chain of migrations for command meanings. |
| `src/events/migrations/v1.ts` | Create | The first command version. A placeholder chain entry so the mechanism is exercised from day one. |
| `src/project/create.ts` | Create | Creates an empty project. |
| `src/project/load.ts` | Create | Validates a file, reports problems as diagnostics, and never deletes data silently. |
| `src/project/save.ts` | Create | Serialises log and snapshots into the file format. |
| `src/project/invariants.ts` | Create | Checks rules the schema cannot (every circuit member exists, a wire's endpoints exist). |
| `tests/ids.test.ts`, `tests/units.test.ts` | Create | IDs are unique and sortable. Unit conversions round-trip. |
| `tests/apply.test.ts` | Create | Each command produces the expected model and rejects invalid input. |
| `tests/log-replay.test.ts` | Create | Replay equals the live model. Undo restores the earlier state. |
| `tests/snapshot.test.ts` | Create | Opening from a snapshot equals opening from the full log. |
| `tests/compaction.test.ts` | Create | Compaction preserves the final model and never removes the original without confirmation. |
| `tests/roundtrip.test.ts` | Create | Save then load returns the same project. Property test over random command sequences. |
| `tests/migration.test.ts` | Create | Old-version log fixtures replay to the expected models. |
| `tests/fixtures/log-v1.json` | Create | The first fixture. A new one is added for every version. |

#### Package `packages/i18n` (skeleton)

| File | Action | Rationale |
| --- | --- | --- |
| `package.json`, `tsconfig.json`, `src/index.ts` | Create | Package definition and public API. |
| `src/catalogs/he.json` | Create | Hebrew messages. Hebrew is the source language. |
| `src/catalogs/en.json` | Create | English messages. |
| `src/direction.ts` | Create | Direction rules: interface mirrors with the language, numbers and units read left to right. |
| `src/format/numbers.ts`, `src/format/units.ts` | Create | Locale-aware number and unit formatting. |
| `tests/keys.test.ts` | Create | Fails if the two catalogs have different keys, or a message uses a parameter the other lacks. |

**Phase 0 exit:** the build fails on a layer violation, a file over 300 lines, a use of `any`, or a marker without an issue number. A project round-trips through save and load.

### Phase 1: catalog and engine with no screen

#### Package `packages/catalog`

| File | Action | Rationale |
| --- | --- | --- |
| `package.json`, `tsconfig.json`, `src/index.ts` | Create | Package definition. Imports `model` only. |
| `src/registry.ts` | Create | The registry of device kinds. Behaviour is reached through it and never through name checks. |
| `src/power-types.ts` | Create | The four power types, and for each the conductor roles of its power system. |
| `src/conductors.ts` | Create | Conductor roles and standard colours per profile. |
| `src/kinds/grid.ts`, `generator.ts`, `breaker.ts`, `busbar.ts`, `transformer.ts`, `disconnector.ts`, `earthing-disconnector.ts`, `load.ts` | Create | One file per core component: terminals, parameters with units and ranges, supported power types, behaviours, and zero-sequence data fields. |
| `src/cables/cable-types.ts` | Create | Cable types with conductor data and provenance. |
| `src/standards/manifest.ts` | Create | Pins the standards and editions used by version 1, by profile. |
| `src/standards/profile.ts` | Create | A profile is a named set of tables and rules. |
| `src/standards/il/ampacity.ts`, `il/voltage-drop-limits.ts`, `il/earth-fault.ts` | Create | Israeli-law tables. Entered and checked by the owner under the terms settled in the open question. Each value carries its source. |
| `src/standards/iec/conductors-60228.ts`, `iec/ampacity-60364-5-52.ts`, `iec/short-circuit-60909.ts`, `iec/disconnection-60364-4-41.ts` | Create | IEC tables and factors, each tagged with standard, edition and clause. |
| `tests/registry.test.ts` | Create | Every kind registers and has a complete schema. |
| `tests/provenance.test.ts` | Create | Fails when a standards value has no source tag. |
| `tests/kind-schemas.test.ts` | Create | Parameter ranges and units are valid for every kind. |

#### Package `packages/engine`

| File | Action | Rationale |
| --- | --- | --- |
| `package.json`, `tsconfig.json`, `src/index.ts` | Create | Package definition. Imports `model` and `catalog` only. No DOM, no React. |
| `src/numeric/complex.ts` | Create | Complex number type and operations. |
| `src/numeric/matrix.ts` | Create | Dense matrix type. |
| `src/numeric/lu.ts` | Create | LU decomposition with pivoting and a solve step. |
| `src/numeric/conditioning.ts` | Create | Detects singular and badly conditioned systems and reports which nodes are floating. |
| `src/net/derive.ts` | Create | Derives nets from terminals, wires and explicit junctions. |
| `src/net/regions.ts` | Create | Splits the derived network into regions of one power type. |
| `src/net/boundaries.ts` | Create | Finds converters and defines the exchange values at each boundary. |
| `src/solvers/types.ts` | Create | The interface every solver implements: input network, output results, diagnostics, trace. |
| `src/solvers/ac3-radial.ts` | Create | Balanced three-phase sweep for radial networks. |
| `src/solvers/ac3-mesh.ts` | Create | Iterative balanced three-phase solution for meshed networks. |
| `src/solvers/ac1.ts` | Create | Single-phase solver. |
| `src/solvers/dc.ts` | Create | DC solver with source characteristics. |
| `src/solvers/boundary-iteration.ts` | Create | Repeats until boundary values agree, within a tolerance and an iteration cap, and reports a diagnostic if it does not. |
| `src/solvers/phase-allocation.ts` | Create | Allocates single-phase loads to phases and reports per-phase and neutral currents labelled "balanced-model estimate". |
| `src/shortcircuit/sequence-networks.ts` | Create | Positive, negative and zero-sequence networks. |
| `src/shortcircuit/iec60909.ts` | Create | Maximum and minimum fault currents from all sources and paths, with peak and breaking current. |
| `src/shortcircuit/capacity-check.ts` | Create | Compares each device's breaking capacity with the fault current at its location. |
| `src/cable/sizing.ts` | Create | Cable sizing from the profile's tables. |
| `src/cable/derating.ts` | Create | Correction factors for installation and grouping. |
| `src/earthfault/loop.ts` | Create | Earth-fault loop impedance and the disconnection-time check. |
| `src/diagnostics/emit.ts` | Create | Builds diagnostics from codes and parameters. Missing input produces a diagnostic and no result. |
| `src/trace/trace.ts` | Create | The trace record: formula ID, inputs with origin, standard, clause, assumed flag. |
| `src/trace/formulas.ts` | Create | Registry of formula IDs and their descriptions. |
| `src/worker/protocol.ts`, `coalesce.ts`, `worker.ts` | Create | Message protocol that coalesces rapid requests and drops stale results, and the worker entry point. |
| `tests/numeric/*.test.ts` | Create | Complex arithmetic, LU solving and conditioning against reference matrices. |
| `tests/net/*.test.ts` | Create | Net derivation, including three or more wires on one terminal, open switches, and implicit-to-explicit junction conversion that must not change connectivity. |
| `tests/solvers/*.test.ts` | Create | One test file per solver with closed-form cases. |
| `tests/properties/*.test.ts` | Create | Property tests: power balance, current balance at every net, invariance under a change of base voltage, two equal parallel paths halve the impedance. |
| `tests/reference/*.test.ts` | Create | Runs every case in `tests/reference-cases/` and compares with the stated tolerance. |
| `tests/worker.test.ts` | Create | Coalescing and stale-result dropping. |

#### Reference cases and generator

| File | Action | Rationale |
| --- | --- | --- |
| `tests/reference-cases/README.md` | Create | Explains the format of a case and the tolerance rules. |
| `tests/reference-cases/iec-60909/*.json` | Create | Worked examples from the published IEC technical report, entered by hand and reviewed by the owner. |
| `tests/reference-cases/ieee/*.json` | Create | Standard IEEE test networks. |
| `tests/reference-cases/pandapower/*.json` | Create | Answers generated by pandapower for the same networks, committed as files so CI needs no Python. |
| `tests/reference-cases/hand/*.json` and `*.md` | Create | Hand calculations with the full working shown. Israeli-law cases are checked by the owner. |
| `tests/reference-cases/transformer-sides.json` | Create | The test that settles the suspected Blue Grid transformer impedance error. |
| `tools/reference/README.md`, `requirements.txt`, `generate_pandapower_cases.py` | Create | Regenerates the pandapower answers. Run by hand, never in CI. |

**Phase 1 exit:** every case passes within tolerance, every displayed result has a trace, the owner has recorded sign-off in `docs/verification/signoff.md`, and the transformer-side test is settled either way.

### Phases 2 to 6: packages and key folders only

| Phase | Packages and folders created | Spec required before work |
| --- | --- | --- |
| 2 | `packages/scene`, `packages/symbols`, `packages/editor` (tools, commands, advice rules), `packages/ui` (SVG renderer, canvas renderer, forms from schemas, problems panel, design tokens), `apps/web` (Vite shell), end-to-end tests with Playwright | Editor and nets, compound wires, rendering handover, design system, first-run guide |
| 3 | `packages/views` (circuit schedule, bill of quantities), `packages/io` (DXF, spreadsheet, document, PDF), switching-order logic in `engine`, template files, golden-file tests | Each document and its template |
| 4 | More kinds in `catalog`, `engine/src/solvers/series-loop.ts`, `engine/src/protection/`, `views` load aggregation and the visual collapse, protection-curve tables | Series loops, protection and selectivity, simplification |
| 5 | `views` panel layout, enclosure and rail data in `catalog`, DXF panel export in `io` | Panel layout and plan export |
| 6 | `packages/platform` interfaces and adapters, `packages/editions`, `apps/desktop` wrapper (optional, Electron), cloud storage and sync, licence handling | Editions, cloud merge rule, licence check |

### Pseudo-schemas

Shapes only, not code.

```text
Command envelope:
  id: ULID, type: string, version: integer, time: instant, author: string,
  payload: type-specific data referring to entity IDs only

Diagnostic:
  code: stable string, severity: error | warning | info,
  entities: list of IDs, params: map of name to value

Trace record:
  formula: formula ID, inputs: list of (name, value, unit, origin),
  standard: tag, clause: tag, assumed: boolean, result: value with unit
  origin is one of: entered | catalog | standard | assumed

Solver interface:
  solve(region, boundaryValues) -> { results, diagnostics, traces }
  never throws for bad input; returns diagnostics and no results
```

### Verification Plan

*   **Compilation/Build**: `pnpm -r build` with TypeScript strict mode, including test folders.
*   **Unit Tests**: `pnpm test`, covering model, catalog, engine and i18n.
*   **Reference Tests**: `pnpm test:reference` runs every case in `tests/reference-cases/`. All must pass within their stated tolerance. Proposed tolerances: 1 percent for fault current and 0.1 percent for voltage drop against pandapower, and the published rounding for published examples.
*   **Property Tests**: power balance, current balance at every net, base-voltage invariance, parallel-path symmetry, and replay equals live model for random command sequences.
*   **Static Analysis & Linting**: `pnpm lint`, `pnpm typecheck`, `pnpm depcheck` (layer rules), `pnpm dupcheck`, `pnpm unused`, and the marker check.
*   **Test Coverage Requirement**: at least 85 percent branch coverage for `model` and `engine`. Coverage never replaces the reference tests.
*   **E2E/Integration**: none in Phases 0 and 1. From Phase 2, Playwright covers five to ten user journeys, including the first-feeder journey.
*   **Review gates**: Phase 1 ends only with the owner's sign-off. An AI session may not change an expected number in a reference case without the owner's review.

--------------------------------------------------------------------------------

*Drafted with EGM*
