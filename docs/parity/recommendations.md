# Recommendations on the Blue Grid parity checklist

*Generated from `data/rows.json`. Five fresh reviewers each evaluated a topic group of rows against the owner's decisions and the design; duplicates were reconciled afterwards (see below). These are recommendations, not decisions: the owner marks each row in the checklist page.*

## Summary

* **357** rows. **317** recommended as proposed, **40** with a different decision, **25** flagged as the owner's call, **28** with a different phase from the scanner's.
* The reviewers checked the Blue Grid code for some rows and not others. Reasons ending in *Unverified* were not checked against the code (68 rows, mostly the wiring and zones group).
* Elephant reconciliation: live load monitoring (UI-045, UI-060, CH-095, SIM-043, SIM-044) is recommended DROP, with static load aggregation kept; operational tools split between Phase 3 (lock-out, earthing) and Phase 4 (faults, leakage) in ED-052; the Blue Grid file converter (ED-058) is flagged as optional because the owner said conversion is not required.

## Where I recommend changing the proposed decision

| ID | Feature | Proposed | Recommended | Phase | Why |
|---|---|---|---|---|---|
| UI-002 | Recent projects list | LATER | REDESIGN | 2 | Local recent projects are needed on the Phase 2 landing page (see ED-060); only created-by and updated-by names wait for Phase 6. |
| UI-007 | Header: Home button, version label (opens changelog) | KEEP | REDESIGN | 2 | Keep Home and the version label; the version should link to release notes, not open a changelog dialog. |
| UI-015 | Zone selection pane | LATER | KEEP | 2 | Zones are drawn in Phase 2, so the layers pane (hide, lock, rename, centre) ships with them; deferring leaves zones unmanageable. Unverified. |
| UI-018 | Canvas controls island | KEEP | REDESIGN | 2 | Keep zoom in, zoom out and fit with shortcuts; drop centre-on-origin, since a diagram has no meaningful origin. |
| UI-028 | Cable and protection calculator | LATER | REDESIGN | 2 | Same feature as CH-011: cable sizing is a Phase 1 engine gate under the standards profile; this modal surface is Phase 2 in the inspector. |
| UI-029 | Zone properties | LATER | KEEP | 2 | Zone name, colour, size and title position are basic properties of zones drawn in Phase 2 and used for location text. Unverified. |
| UI-041 | Properties: annotation shapes | LATER | KEEP | 2 | Annotation style properties belong with the Phase 2 annotation layer (CH-019, CH-020); splitting them into Phase 4 leaves annotations unstyled. Unverified. |
| UI-045 | Sim panel: load monitoring card | LATER | DROP | - | Live monitoring meters over a rehearsal do not fit a calculation tool. Static load aggregation (UI-032, SIM-046) covers design loading. Your call. |
| UI-056 | Context menu (simulation) | KEEP | REDESIGN | 3 | Same feature as ED-050; every action must be a real command, with no Hebrew text built in logic, and it feeds the switching order. |
| UI-059 | Load balance report | LATER | REDESIGN | 4 | Same feature as CH-092; keep with configurable status thresholds and shown formulas, once aggregation exists in Phase 4. |
| UI-060 | Load-over-time and peak charts | LATER | DROP | - | Trend and peak charts need live time-series that the design drops (see SIM-043). Static load tables cover it. Your call. |
| ED-009 | Mirror | REDESIGN | DROP | - | Verified: Mirror just adds 180 degrees, which two rotations already give; a true flip is unneeded for single-line symbols. |
| ED-035 | Z-order | KEEP | REDESIGN | 2 | Electrical symbols rarely overlap; offer only bring-to-front and send-to-back for annotation-layer objects, as forward and backward are bugs. |
| ED-063 | PNG snapshot export | REDESIGN | MERGE | 3 | Same as CH-036: image export comes from the drawing description with PDF and DXF, not DOM cloning; whether to offer PNG is a product call. |
| ED-067 | Help: shortcut reference | MERGE | REDESIGN | 2 | Electricians expect a shortcut reference; generate it from the command registry so it cannot drift, rather than folding it into first-run hints. |
| ED-070 | Label placement and style | KEEP | REDESIGN | 2 | Same feature as CH-022; keep label placement and style but measure text width instead of guessing, which breaks for Hebrew. |
| CH-026 | Context menus in edit and sim (group, delete, leakage, LOTO, grounding) | KEEP | REDESIGN | 2 | Same feature as ED-033 and ED-050; edit menu in phase 2, simulation actions in phase 3, every item a real command. |
| CH-033 | Light / dark theme | KEEP | REDESIGN | 2 | Same feature as ED-074, which is REDESIGN; the scanner's KEEP disagrees with it. Tokens and themes are rebuilt. |
| CH-037 | Hebrew RTL UI | REDESIGN | KEEP | 0 | Hebrew RTL is a structural requirement from the i18n skeleton, so logical directions are used from the start. |
| CH-039 | Help center, Evolution Log (changelog) modal | KEEP | REDESIGN | 2 | Keep Help as one page; the changelog part follows UI-066 (LATER, link only). Row mixes two features. |
| CH-046 | Earth switch three positions, grounds bottom port only | KEEP | MERGE | 1 | Same feature as COMP-020; earthing disconnector is a core component, so merge into the switch with an earthing capability, keeping the open-circuit rule. |
| CH-048 | Blocked-action feedback (shake, message) | REDESIGN | DROP | - | The shake is dropped (ED-087); the refusal message already comes from the problems panel (CH-096), so this row adds nothing. |
| CH-066 | Faults on cables generate short-circuit current | KEEP | REDESIGN | 1 | Cable-fault current in Blue Grid falls back to ik_max or a silent 1000 A default; it must come from the short-circuit calculation. |
| CH-067 | Electronic breaker with LSIG settings | REDESIGN | MERGE | 4 | Owner says electronic breaker becomes a protection profile on the switch, not a separate type; keep L/S/I/G settings in the profile. |
| CH-070 | RCD: leakage threshold, trip at >=, power cut when open or tripped | REDESIGN | LATER | 4 | Same feature as COMP-023; RCD is not in the core eight and needs earth-fault logic, so one consistent Phase 4 entry. |
| CH-074 | Spatial culling and zoom-dependent detail levels | KEEP | REDESIGN | 2 | Same feature as ED-044; keep the spatial index and detail levels but redo them for the SVG then canvas rendering. |
| CH-075 | Phase splitter (3-phase to 1-phase R/S/T) | REDESIGN | DROP | - | The phase splitter disappears once wires split into conductors; single-phase loads connect to one conductor. |
| CH-081 | Generator with fuel, drift, sync | REDESIGN | KEEP | 1 | Generator is core (COMP-002 says Phase 1); only fuel and synchronising logic wait for Phase 4. |
| CH-085 | UPS and DC UPS (state machine, battery, bypass, backup time, sidebar panel) | REDESIGN | MERGE | 4 | Same as COMP-010/011: UPS is a template over converter, battery and bypass, keeping the mode behaviour electricians rely on. |
| CH-086 | Battery bank (SOC, charge, time remaining), PV array, EV charger toggle | KEEP | LATER | 4 | Battery, PV and EV are not core; align with COMP-003/004 as Phase 4, and EV charger merges into load. |
| CH-095 | Component load graph modal | LATER | DROP | - | Per-component load history needs the dropped time-series monitoring (see SIM-043). Your call. |
| CH-099 | Animated power flow on wires with phase colour | REDESIGN | LATER | 4 | Same feature as ED-080, which defers animation to Phase 4; static energised colouring comes with results display. Unverified. |
| COMP-016 | EV_CHARGER | LATER | MERGE | 4 | A switchable AC or DC consumer is a load with a type match; merge into load rather than keeping a fourth consumer type. |
| COMP-026 | PHASE_SPLITTER | REDESIGN | DROP | - | Owner says phase splitter disappears once wires split into conductors; compound wire (Phase 2) replaces it. |
| SIM-009 | Voltage drop and losses | KEEP | REDESIGN | 1 | Voltage drop must be re-derived with traces and no silent cable defaults, not kept as the Blue Grid code. |
| SIM-010 | Fault current (IEC 60909) | KEEP | REDESIGN | 1 | Blue Grid uses one shortest path, fixed X/R of 10 and 5, and a doubted transformer impedance; it needs full IEC 60909 in Phase 1. |
| SIM-018 | CCR open-circuit trip | LATER | DROP | - | Trigger string is set nowhere in simulation/ (Protection.ts:55), so it is dead code; open-circuit detection is covered by SIM-019 and CH-087. |
| SIM-032 | Generator drift | LATER | DROP | - | Drifting generator voltage and frequency is animation realism, not engineering output; a static calculation tool does not need it. |
| SIM-043 | Load monitoring | LATER | DROP | - | Time-weighted sampling of a live rehearsal does not fit a static calculation; load aggregation covers design loading. |
| SIM-044 | Load history trace | LATER | DROP | - | A one-hour ring buffer of rehearsal samples has no basis in the static calculation model and is never persisted. |

## Rows that are your call

| ID | Feature | My lean | Phase | Why |
|---|---|---|---|---|
| UI-010 | Header: Snapshot (camera) button | Accept | 3 | Image export belongs with documents in phase 3; what the Blue Grid snapshot actually outputs is unverified, so whether to ship it is the owner's call. |
| UI-045 | Sim panel: load monitoring card | Change to DROP | - | Live monitoring meters over a rehearsal do not fit a calculation tool. Static load aggregation (UI-032, SIM-046) covers design loading. Your call. |
| UI-058 | Switching order export | Accept | 3 | Print and PDF are needed for the first release; Word with right-to-left layout is costly, so confirm it is wanted. |
| UI-060 | Load-over-time and peak charts | Change to DROP | - | Trend and peak charts need live time-series that the design drops (see SIM-043). Static load tables cover it. Your call. |
| UI-065 | Usage policy | Accept | 2 | Keep a one-time notice and a reference page, but drop the mandatory name field; a blocking acknowledgement is a legal call. |
| UI-066 | Changelog dialog | Accept | 6 | Release notes as a link or page, not a dialog; nobody needs an in-app version history before editions exist. |
| UI-071 | Phone sim shell | Accept | 6 | Read-only phone view may come later; mobile editing is a non-goal, so whether to ship it is a product call. |
| UI-072 | Phone header menu | Accept | 6 | Phone menu belongs with the later read-only phone view; mobile editing is a non-goal. |
| ED-045 | Touch: one finger pan | Accept | 6 | Touch pan belongs to the read-only phone view; a desktop browser needs no touch handling first. |
| ED-046 | Touch: pinch zoom | Accept | 6 | Pinch zoom only matters for the later read-only touch or tablet view; whether to support touch at all is the owner's call. |
| ED-047 | Touch: long-press menu | Accept | 6 | Touch long-press is an editing aid, so keep it with the later touch work, including the rule that a gesture never operates a switch. |
| ED-048 | Phone layout (view-only) | Accept | 6 | Read-only phone layout is a later owner call; editing on a phone is a non-goal. |
| ED-058 | Import migration / legacy | Accept | 3 | You said converting Blue Grid files is optional. If you want it, a reporting converter in Phase 3 lets existing users import before release. |
| ED-063 | PNG snapshot export | Change to MERGE | 3 | Same as CH-036: image export comes from the drawing description with PDF and DXF, not DOM cloning; whether to offer PNG is a product call. |
| CH-036 | PNG snapshot of the diagram | Accept | 3 | Merge into the drawing export; whether PNG is offered at all is a product call. |
| CH-038 | Usage policy modal | Accept | 2 | Same feature as UI-065; Phase 0 has no UI, so it lands in Phase 2. Wording can sit in the design's risks until then. |
| CH-039 | Help center, Evolution Log (changelog) modal | Change to REDESIGN | 2 | Keep Help as one page; the changelog part follows UI-066 (LATER, link only). Row mixes two features. |
| CH-095 | Component load graph modal | Change to DROP | - | Per-component load history needs the dropped time-series monitoring (see SIM-043). Your call. |
| CH-102 | Phone view and simulate mode (bottom action bar, sheets, header menu) | Accept | 6 | Read-only phone viewing later; the simulate controls and bottom action bar are not carried over. |
| CH-103 | Touch gestures (pan, pinch, long-press) and discard of leftover tap after gesture | Accept | 6 | Touch is later and read-only; keep the rule that a trailing click after a gesture never operates a breaker. |
| CH-104 | Electron desktop app, portable EXE, single-instance lock | Accept | 6 | Electron is optional and later; the single-instance lock is a platform detail. |
| CH-105 | Standalone single-file HTML (offline, bundled assets) | Accept | 6 | Offline use comes with the long-term-support edition as an installable web app; a single-file build is a distribution choice. |
| SIM-032 | Generator drift | Change to DROP | - | Drifting generator voltage and frequency is animation realism, not engineering output; a static calculation tool does not need it. |
| SIM-043 | Load monitoring | Change to DROP | - | Time-weighted sampling of a live rehearsal does not fit a static calculation; load aggregation covers design loading. |
| SIM-044 | Load history trace | Change to DROP | - | A one-hour ring buffer of rehearsal samples has no basis in the static calculation model and is never persisted. |

## All rows

| ID | Feature | Proposed | Recommendation | Phase | Confidence | Why |
|---|---|---|---|---|---|---|
| UI-001 | Landing screen: new project / import file | REDESIGN | Accept | 2 | high | Landing with new, open and recent is still needed; fold the tutorial entry into the first-run guide. |
| UI-002 | Recent projects list | LATER | Change to REDESIGN | 2 | medium | Local recent projects are needed on the Phase 2 landing page (see ED-060); only created-by and updated-by names wait for Phase 6. |
| UI-003 | Landing: tutorial entry, usage policy, settings, changelog links | MERGE | Accept | 2 | high | Landing footer links fold into the first-run checklist and the separate policy, settings and changelog rows; unverified against the code. |
| UI-004 | "Experimental version" badge and Blue Grid/IAF credit on landing | DROP | Accept | - | high | Organisation branding and experimental badge must not carry over; credit strings also leak into print footers. |
| UI-005 | Header: project name edit | KEEP | Accept | 2 | high | Inline rename of the project name is basic; no dialog needed, just an editable field. |
| UI-006 | Header: Edit / Simulate mode switch | REDESIGN | Accept | 2 | high | One persistent layout with simulation as an overlay avoids the state wipe on mode switch. |
| UI-007 | Header: Home button, version label (opens changelog) | KEEP | Change to REDESIGN | 2 | medium | Keep Home and the version label; the version should link to release notes, not open a changelog dialog. |
| UI-008 | Header: Undo / Redo | KEEP | Accept | 2 | high | Undo and redo buttons are essential and fall out of the command log; keep the Ctrl+Z, Ctrl+Y and Ctrl+Shift+Z shortcuts. |
| UI-009 | Header: New / Save / Load project buttons | REDESIGN | Accept | 2 | high | Save and open go through the storage interface; Phase 0 file core, buttons in the Phase 2 top bar. |
| UI-010 | Header: Snapshot (camera) button | LATER | Accept | 3 | low | Image export belongs with documents in phase 3; what the Blue Grid snapshot actually outputs is unverified, so whether to ship it is the owner's call. |
| UI-011 | Header: theme toggle | MERGE | Accept | 2 | high | Theme is a setting in the design system; a header shortcut is optional. |
| UI-012 | Header: accessibility button | MERGE | Accept | 2 | high | A separate accessibility button is redundant once settings hold the same options. |
| UI-013 | Header: help button | MERGE | Accept | 2 | high | One help entry that reopens the first-run guide and help pages. |
| UI-014 | Header: Select tool vs Zone tool switch | KEEP | Accept | 2 | high | Select and zone tools are needed in the editor; the mode banner and cancel rule apply. Unverified. |
| UI-015 | Zone selection pane | LATER | Change to KEEP | 2 | medium | Zones are drawn in Phase 2, so the layers pane (hide, lock, rename, centre) ships with them; deferring leaves zones unmanageable. Unverified. |
| UI-016 | Header: Settings shortcut in sim | MERGE | Accept | 2 | medium | A settings shortcut is just an entry point to the one settings view. |
| UI-017 | Operational toolbox (drag tools) | KEEP | Accept | 3 | medium | Lock-out/tag-out and earthing are real features tied to the switching order in phase 3; faults and leakage tools follow in phase 4. |
| UI-018 | Canvas controls island | KEEP | Change to REDESIGN | 2 | high | Keep zoom in, zoom out and fit with shortcuts; drop centre-on-origin, since a diagram has no meaningful origin. |
| UI-019 | Canvas aids | KEEP | Accept | 2 | medium | Grid, snap and zone toggles are needed; axes are a developer aid and can be dropped. Unverified. |
| UI-020 | Left sidebar shell (collapsible) | REDESIGN | Accept | 2 | high | One persistent panel set is a settled UX rule; the load-balance report moves to results. |
| UI-021 | Right sidebar shell (collapsible) | REDESIGN | Accept | 2 | high | Same finding as UI-020: no mode-dependent sidebar swapping; one collapsible persistent panel layout. |
| UI-022 | Component library | REDESIGN | Accept | 2 | high | Library is redesigned around the 20-24 types; the first eight components ship in Phase 2 and the rest in Phase 4. Unverified. |
| UI-023 | Component help dialog | KEEP | Accept | 2 | medium | Electricians use the component description; generate it from catalog data instead of hand-written text per type. |
| UI-024 | Library hover tooltip | MERGE | Accept | 2 | high | A hover summary is a short form of the info panel; one source for both. |
| UI-025 | Left sidebar: multi-selection panel | KEEP | Accept | 2 | high | Multi-selection feedback is useful; show count and group actions in the inspector. |
| UI-026 | Wire properties: label and style | REDESIGN | Accept | 2 | high | Wire label and routing options move into the compound-wire inspector with appearance last. Unverified. |
| UI-027 | Wire properties: engineering spec | REDESIGN | Accept | 2 | high | Compound-wire inspector is right; required fields or a diagnostic replace Blue Grid's silent N2XY 150 mm2 100 m default. |
| UI-028 | Cable and protection calculator | LATER | Change to REDESIGN | 2 | medium | Same feature as CH-011: cable sizing is a Phase 1 engine gate under the standards profile; this modal surface is Phase 2 in the inspector. |
| UI-029 | Zone properties | LATER | Change to KEEP | 2 | medium | Zone name, colour, size and title position are basic properties of zones drawn in Phase 2 and used for location text. Unverified. |
| UI-030 | Empty-selection hint | KEEP | Accept | 2 | high | Empty-selection hint is trivial and useful in the inspector. Unverified. |
| UI-031 | Properties editor: label and look | REDESIGN | Accept | 2 | high | Appearance group of the schema-driven form; label and colours stay per element. |
| UI-032 | Properties editor: load monitoring group | LATER | Accept | 4 | medium | Monitoring groups with a diversity factor map to load aggregation, a Phase 4 view over the full calculation. |
| UI-033 | Properties: sources group (GRID, GEN, PV) | REDESIGN | Accept | 2 | medium | Schema-driven source forms replace hand-written ones; fuel fields move to the fuel tank in phase 4. |
| UI-034 | Properties: switching devices (breaker, disconnector, earth switch, load breaker, fuse) | REDESIGN | Accept | 2 | high | One switch type with a capability set drives which rating fields show. |
| UI-035 | Properties: electronic breaker protection settings | LATER | Accept | 4 | high | Protection profile fields need the curve engine, which is Phase 4. |
| UI-036 | Time-current (TCC) curve viewer | LATER | Accept | 4 | high | Time-current curves belong with selectivity in Phase 4; image export is a separate owner choice. |
| UI-037 | Properties: transformer | REDESIGN | Accept | 2 | medium | Engine fields are Phase 1, but the generated property form belongs to the Phase 2 editor. |
| UI-038 | Properties: loads and EV charger | REDESIGN | Accept | 2 | high | Merged load form, with the EV charger extras in Phase 4. |
| UI-039 | Properties: converters, UPS, battery, other types | LATER | Accept | 4 | high | These types arrive in Phase 4 with the merged converter and battery model. |
| UI-040 | Properties: control logic (interlock, synchronizer, ATS, ATS controller) | LATER | Accept | 4 | high | Control logic is one Phase 4 layer, with links bound by ID instead of label text. Unverified. |
| UI-041 | Properties: annotation shapes | LATER | Change to KEEP | 2 | medium | Annotation style properties belong with the Phase 2 annotation layer (CH-019, CH-020); splitting them into Phase 4 leaves annotations unstyled. Unverified. |
| UI-042 | Properties: subsystem | LATER | Accept | 4 | high | Subsystem ports and loading become a Phase 4 view over the full calculation, bound by ID not label. Unverified. |
| UI-043 | Sim right panel: selected item header and status | REDESIGN | Accept | 2 | medium | Phase 1 has no editor, so the selected-item results panel with coded diagnostics ships with the editor; the console covers phase 1. |
| UI-044 | Sim panel: live electrical data | REDESIGN | Accept | 1 | high | Voltage, current and frequency appear first in the Phase 1 console, then on the editor. |
| UI-045 | Sim panel: load monitoring card | LATER | Change to DROP | - | low | Live monitoring meters over a rehearsal do not fit a calculation tool. Static load aggregation (UI-032, SIM-046) covers design loading. Your call. |
| UI-046 | Sim panel: phase monitoring (3-phase) | REDESIGN | Accept | 1 | high | Per-phase values come from the balanced model and must carry an estimate label. |
| UI-047 | Sim panel: loss and voltage-drop analysis | REDESIGN | Accept | 1 | high | Voltage drop, loss and impedance come from the single engine in Phase 1, with a show-calculation view. Unverified. |
| UI-048 | Sim panel: short-circuit and standards checks | REDESIGN | Accept | 1 | high | Earth-fault loop check is a core result, shown with formula, inputs and clause. |
| UI-049 | Sim panel: cumulative voltage-drop section | MERGE | Accept | 1 | high | Cumulative voltage drop is one result block with the main results. |
| UI-050 | Sim panel: UPS / DC UPS management | LATER | Accept | 4 | high | UPS status is a composition of converter, battery and bypass, so it follows those in Phase 4. |
| UI-051 | Sim panel: empty state | KEEP | Accept | 2 | high | An empty-state hint in the results panel costs little and orients new users. |
| UI-052 | Switching log panel | REDESIGN | Accept | 3 | high | Editable switching log feeds the switching order; errors go to the problems panel and the log survives mode changes. |
| UI-053 | Log footer: generate switching order, load balance report buttons | MERGE | Accept | 3 | medium | Both buttons become entries in a documents menu; the load report entry waits for Phase 4. |
| UI-054 | System alerts log (desktop) | REDESIGN | Accept | 2 | high | The problems panel with severity, click-to-select and a fix per entry replaces both the alert feed and alert() boxes; spreadsheet export later. |
| UI-055 | Context menu (edit) | KEEP | Accept | 2 | high | Edit commands are relied on; group and ungroup entries only arrive with the Phase 4 visual collapse. Unverified. |
| UI-056 | Context menu (simulation) | KEEP | Change to REDESIGN | 3 | high | Same feature as ED-050; every action must be a real command, with no Hebrew text built in logic, and it feeds the switching order. |
| UI-057 | Switching order preview and template | REDESIGN | Accept | 3 | high | Neutral editable template with configurable numbering, steps, lock-out points, voltage-absence check, signatures and optional user logo. |
| UI-058 | Switching order export | KEEP | Accept | 3 | medium | Print and PDF are needed for the first release; Word with right-to-left layout is costly, so confirm it is wanted. |
| UI-059 | Load balance report | LATER | Change to REDESIGN | 4 | medium | Same feature as CH-092; keep with configurable status thresholds and shown formulas, once aggregation exists in Phase 4. |
| UI-060 | Load-over-time and peak charts | LATER | Change to DROP | - | low | Trend and peak charts need live time-series that the design drops (see SIM-043). Static load tables cover it. Your call. |
| UI-061 | Leakage modal and meter | LATER | Accept | 4 | medium | Leakage and RCD behaviour belong with the Phase 4 fault tools. Unverified. |
| UI-062 | Settings: accessibility and appearance | REDESIGN | Accept | 2 | high | Appearance settings (theme, text size, contrast, motion) go to the Phase 2 design system; simulation options stay on the console. |
| UI-063 | Settings: user name | LATER | Accept | 6 | medium | A user name only matters once editions and accounts exist; Phase 2 can leave it out. |
| UI-064 | Settings: simulation and calculation | REDESIGN | Accept | 1 | high | One calculation with view toggles for which results to show; simple/detailed mode and legacy solver are dropped. |
| UI-065 | Usage policy | REDESIGN | Accept | 2 | medium | Keep a one-time notice and a reference page, but drop the mandatory name field; a blocking acknowledgement is a legal call. |
| UI-066 | Changelog dialog | LATER | Accept | 6 | medium | Release notes as a link or page, not a dialog; nobody needs an in-app version history before editions exist. |
| UI-067 | Help center | MERGE | Accept | 2 | high | Help becomes part of the first-run checklist with the shortcut list kept as reference. Unverified. |
| UI-068 | Interactive tutorial overlay | MERGE | Accept | 2 | high | A 1,285-line DOM-bound overlay that wipes work is replaced by the non-destructive checklist. Unverified. |
| UI-069 | Confirmation dialog | KEEP | Accept | 2 | high | Confirm dialog stays for destructive actions only, since browser alert and confirm dialogs are banned. |
| UI-070 | Shared form controls | REDESIGN | Accept | 2 | high | Shared controls are design-system components; the type-to-search combo box is worth keeping. |
| UI-071 | Phone sim shell | LATER | Accept | 6 | medium | Read-only phone view may come later; mobile editing is a non-goal, so whether to ship it is a product call. |
| UI-072 | Phone header menu | LATER | Accept | 6 | high | Phone menu belongs with the later read-only phone view; mobile editing is a non-goal. |
| UI-073 | Phone alerts panel | MERGE | Accept | 2 | high | Same problems panel as UI-054; only the phone layout differs and follows later. |
| ED-001 | Edit/Sim mode switch | REDESIGN | Accept | 2 | high | Edit and simulate share one layout; results overlay the diagram and never clear edit state or the log. |
| ED-002 | Tool palette (Select / Zone) | KEEP | Accept | 2 | high | Select and zone tools are required; add Escape and key shortcuts per the visible-modes rule. Unverified. |
| ED-003 | Click select | KEEP | Accept | 2 | high | Click select is essential; use typed ids instead of parsed wire-N strings. Unverified. |
| ED-004 | Multi-select (Shift click, marquee) | KEEP | Accept | 2 | high | Shift-click and marquee are standard; include wires in the marquee, which Blue Grid skips. Unverified. |
| ED-005 | Select all (zone-aware) | REDESIGN | Accept | 2 | medium | Hidden two-stage Select all is surprising; make Ctrl+A plain and add an explicit select-zone-contents command. Unverified. |
| ED-006 | Drag move (multi, locked-aware) | KEEP | Accept | 2 | high | Group drag with one undo step per drag is needed; locked items must stay put and snap to grid applies. |
| ED-007 | Snap to grid | KEEP | Accept | 2 | high | Snap to grid with port-anchored alignment is relied on by electricians. Unverified. |
| ED-008 | Rotate | KEEP | Accept | 2 | high | R rotates clockwise and skips locked items as in Blue Grid; add counter-clockwise on Shift+R and keep labels upright. |
| ED-009 | Mirror | REDESIGN | Change to DROP | - | medium | Verified: Mirror just adds 180 degrees, which two rotations already give; a true flip is unneeded for single-line symbols. |
| ED-010 | Resize components | KEEP | Accept | 2 | high | Busbar width resize is essential; annotation resize follows the same handles and must respect locks. |
| ED-011 | Arrow keys nudge | KEEP | Accept | 2 | high | Arrow nudge is useful; apply locks to zones and components alike and add a Shift step. Unverified. |
| ED-012 | Delete selected | KEEP | Accept | 2 | high | Delete is essential; locked items must be protected from delete and cut, with a test. Unverified. |
| ED-013 | Copy / cut / paste | KEEP | Accept | 2 | high | Copy, cut and paste are expected; honour locks and select pasted items. Unverified. |
| ED-014 | Duplicate | MERGE | Accept | 2 | high | Duplicate is copy plus paste; keep as a shortcut over paste. Unverified. |
| ED-015 | Undo / redo | REDESIGN | Accept | 2 | high | Undo appends a compensating command in the log; one user action must equal one undo step, unlike the 50-snapshot history. |
| ED-016 | Wire drawing | REDESIGN | Accept | 2 | high | Wire drawing creates a compound wire on a net with visible unspecified state, not hidden N2XY 150 mm2 100 m defaults. Unverified. |
| ED-017 | Wire routing (orthogonal A* / direct) | KEEP | Accept | 2 | high | Orthogonal and direct routing are used daily; keep routing in the scene layer, not the model. Unverified. |
| ED-018 | Wire waypoints | KEEP | Accept | 2 | high | Manual waypoints are expected; apply locks to waypoint edits. Unverified. |
| ED-019 | Wire context menu (edit) | KEEP | Accept | 2 | high | Wire context menu stays; act on ids, not array indexes, and add expand-conductors. Unverified. |
| ED-020 | Location zones: draw | KEEP | Accept | 2 | high | Zones are drawn in Phase 2; localise the default name. Unverified. |
| ED-021 | Zone move and resize | KEEP | Accept | 2 | high | Zone move and resize belong with zone drawing. Unverified. |
| ED-022 | Zone selection pane (hide / lock / rename / zoom) | KEEP | Accept | 2 | high | Layers pane for zones ships with zones in Phase 2; rows must be keyboard accessible. Unverified. |
| ED-023 | Show/hide zones, grid, axes | KEEP | Accept | 2 | medium | Zone and grid toggles are useful; drop the axes toggle as a developer aid. Unverified. |
| ED-024 | Subsystem group | REDESIGN | Accept | 4 | high | Grouping must become a view over the full model, not a rewrite that adds wires and connector parts. |
| ED-025 | Subsystem ungroup | LATER | Accept | 4 | medium | Ungroup becomes simply expanding the collapse, lossless once collapse is a view. |
| ED-026 | Enter subsystem / breadcrumbs | LATER | Accept | 4 | medium | Drill-in with breadcrumbs belongs to the visual collapse view; Phase 4. |
| ED-027 | Scoped canvas per subsystem | LATER | Accept | 4 | medium | Scoped canvas follows from visual collapse; Phase 4. |
| ED-028 | Graphics and annotation tools | KEEP | Accept | 2 | high | Annotations go in an annotation layer outside the electrical model, so schedule and bill of quantities never see them. Unverified. |
| ED-029 | Place component from library | KEEP | Accept | 2 | high | Drag or click to place is core; initial state per type must come from the catalog definition, not type-name checks. |
| ED-030 | Link mode: synchroniser / interlock / ATS targets | REDESIGN | Accept | 4 | medium | Link targets are control-logic relations, so they ship with the Phase 4 control layer; the generic visible banner with Escape stays in Phase 2. Unverified. |
| ED-031 | Link mode: generator to fuel tank | REDESIGN | Accept | 4 | medium | Fuel tank is outside the first eight components, so generator fuel linking arrives with the Phase 4 library, with a banner and no alert(). Unverified. |
| ED-032 | Visual link lines | LATER | Accept | 4 | high | Link lines follow the Phase 4 control layer, using the separated colour families. Unverified. |
| ED-033 | Edit context menu (component) | REDESIGN | Accept | 2 | high | Already REDESIGN, but note the verified defects: no stub actions (distribute does nothing), lock enforced on delete and cut, align by bounding box. |
| ED-034 | Component lock | KEEP | Accept | 2 | high | Keep lock, but it must also block delete, cut and property edits; keep it distinct from lock-out/tag-out. |
| ED-035 | Z-order | KEEP | Change to REDESIGN | 2 | medium | Electrical symbols rarely overlap; offer only bring-to-front and send-to-back for annotation-layer objects, as forward and backward are bugs. |
| ED-036 | Align / distribute | REDESIGN | Accept | 2 | high | Align is useful for tidy drawings; implement distribute properly and align by bounding box with ports kept on grid. |
| ED-037 | Rubber-band wire preview | KEEP | Accept | 2 | high | Rubber-band preview is needed; add valid-port highlighting. Unverified. |
| ED-038 | Zoom (wheel) | KEEP | Accept | 2 | medium | Wheel zoom around the pointer is what CAD users expect; consider Ctrl+wheel or a setting so trackpads can pan. |
| ED-039 | Zoom buttons | KEEP | Accept | 2 | high | Keep zoom buttons but clamp to the zoom limits and zoom about the view centre, fixing both noted defects. |
| ED-040 | Pan | KEEP | Accept | 2 | medium | Middle-drag pan is standard; add Space-drag and arrow-key panning, which Blue Grid lacks. |
| ED-041 | Fit to screen | KEEP | Accept | 2 | high | Fit-all is essential for large diagrams; add a keyboard shortcut and let it exceed the minimum zoom. |
| ED-042 | Centre on origin | DROP | Accept | - | high | A diagram has no meaningful origin; fit-all replaces this button. |
| ED-043 | Zoom to component / zone | KEEP | Accept | 2 | high | Zoom-to-item is needed for problems-panel click-through and the layers pane. Unverified. |
| ED-044 | Level of detail and culling | REDESIGN | Accept | 2 | medium | Culling and level of detail keep large diagrams usable; selected and dragged items always render. |
| ED-045 | Touch: one finger pan | LATER | Accept | 6 | medium | Touch pan belongs to the read-only phone view; a desktop browser needs no touch handling first. |
| ED-046 | Touch: pinch zoom | LATER | Accept | 6 | medium | Pinch zoom only matters for the later read-only touch or tablet view; whether to support touch at all is the owner's call. |
| ED-047 | Touch: long-press menu | LATER | Accept | 6 | medium | Touch long-press is an editing aid, so keep it with the later touch work, including the rule that a gesture never operates a switch. |
| ED-048 | Phone layout (view-only) | LATER | Accept | 6 | high | Read-only phone layout is a later owner call; editing on a phone is a non-goal. |
| ED-049 | Touch detection | MERGE | Accept | 6 | medium | Device detection merges into ED-048; layout and input stay separate axes. |
| ED-050 | SIM context menu (component) | REDESIGN | Accept | 3 | medium | Switch, lock-out/tag-out and earthing operations feed the switching order in phase 3; faults and leakage follow in phase 4; no Hebrew in logic. |
| ED-051 | SIM context menu (wire) | LATER | Accept | 4 | medium | Wire lock-out, earth and fault actions in simulate wait for the Phase 4 fault tools; use ids. Unverified. |
| ED-052 | Sim kit tools by drag | LATER | Accept | 3 | medium | Lock-out and earthing tools feed the switching order in Phase 3; fault and leakage tools follow in Phase 4. Drag is optional, a menu works. |
| ED-053 | Click to operate in SIM | LATER | Accept | 4 | medium | Operating switches in a simulation belongs with the control-logic layer and the interlock rules. |
| ED-054 | Hover tooltip with load flow values | REDESIGN | Accept | 2 | medium | Phase 1 has no diagram; the hover tooltip with trace link and assumed flag arrives with the editor results overlay. |
| ED-055 | New project | KEEP | Accept | 2 | high | New project with a confirm that warns about unsaved work; storage core is Phase 0. |
| ED-056 | Save to JSON file | REDESIGN | Accept | 0 | high | Save goes through the storage interface with File System Access and a download fallback. |
| ED-057 | Load from JSON file | REDESIGN | Accept | 0 | high | Open needs validation and ordered migrations that never delete unknown data. |
| ED-058 | Import migration / legacy | REDESIGN | Accept | 3 | medium | You said converting Blue Grid files is optional. If you want it, a reporting converter in Phase 3 lets existing users import before release. |
| ED-059 | Autosave | REDESIGN | Accept | 0 | high | Autosave to IndexedDB behind the storage interface; users must be told it is not a backup. |
| ED-060 | Recent projects | REDESIGN | Accept | 2 | high | Recent local projects on the landing page, with remove from list. |
| ED-061 | Reopen last project | KEEP | Accept | 2 | high | Restoring the last project after a reload prevents lost work. |
| ED-062 | Clear on new / tutorial | REDESIGN | Accept | 2 | high | Starting the tutorial must not wipe user work; the checklist replaces it. Unverified. |
| ED-063 | PNG snapshot export | REDESIGN | Change to MERGE | 3 | medium | Same as CH-036: image export comes from the drawing description with PDF and DXF, not DOM cloning; whether to offer PNG is a product call. |
| ED-064 | Print switching order | MERGE | Accept | 3 | high | Print is one output of the switching order document. |
| ED-065 | Keyboard shortcut guard and disabled states | KEEP | Accept | 2 | high | Ignoring shortcuts while typing is needed; physical-key codes keep R and Ctrl+Z working on a Hebrew layout. |
| ED-066 | Shortcut: Select all / zone select | MERGE | Accept | 2 | high | Same shortcut as ED-005; merge. Unverified. |
| ED-067 | Help: shortcut reference | MERGE | Change to REDESIGN | 2 | medium | Electricians expect a shortcut reference; generate it from the command registry so it cannot drift, rather than folding it into first-run hints. |
| ED-068 | Shortcuts that do NOT exist | REDESIGN | Accept | 2 | high | Escape to cancel any mode is required by the banner rule; add save, fit and tool keys. Unverified. |
| ED-069 | Properties edit panel | REDESIGN | Accept | 2 | high | Inspector is rebuilt as catalog-schema-generated forms rather than a 1,410-line component. Unverified. |
| ED-070 | Label placement and style | KEEP | Change to REDESIGN | 2 | high | Same feature as CH-022; keep label placement and style but measure text width instead of guessing, which breaks for Hebrew. |
| ED-071 | Wire label and path offset | KEEP | Accept | 2 | medium | Wire label with a midpoint offset is useful; keep the offset when waypoints change. Unverified. |
| ED-072 | Confirmation dialog (delete subsystem, new project) | KEEP | Accept | 2 | medium | A confirmation dialog for destructive actions stays, with undo preferred where possible. Unverified. |
| ED-073 | Browser alert() errors | REDESIGN | Accept | 2 | high | alert() is replaced by inline messages and the problems panel with a fix per entry. Unverified. |
| ED-074 | Theme (light/dark) | REDESIGN | Accept | 2 | high | Light and dark are design-system themes defaulting to the OS preference. |
| ED-075 | Accessibility: font scale | KEEP | Accept | 2 | high | Text scaling helps readability; 12 px minimum still applies at the smallest scale. |
| ED-076 | Accessibility: high contrast | KEEP | Accept | 2 | high | High contrast is cheap with design tokens and helps site use in sunlight. |
| ED-077 | Accessibility: reduce motion | KEEP | Accept | 2 | high | Reduced motion respects the OS setting; animated current is an overlay and can be switched off. |
| ED-078 | Canvas keyboard accessibility | REDESIGN | Accept | 2 | medium | Keyboard and screen-reader access to diagram items is a real gap; do the basics in Phase 2. Unverified. |
| ED-079 | Persisted view preferences | MERGE | Accept | 2 | high | View preferences persist through the same storage interface; only per-viewer conveniences. |
| ED-080 | Flow animation toggle | LATER | Accept | 4 | high | Animated current is polish outside the first release; keep the toggle and the visible-wire budget. Unverified. |
| ED-081 | Settings dialog (accessibility and simulation tabs) | REDESIGN | Accept | 1 | medium | Split it: simulation options become inputs on the Phase 1 console page; appearance goes to Phase 2 settings. |
| ED-082 | Mouse cursors and edit feedback | KEEP | Accept | 2 | high | Mode-specific cursors stay, now alongside the visible banner. Unverified. |
| ED-083 | Canvas border status | DROP | Accept | - | high | Mode-coloured border breaks the colour-family rule, and red is reserved for alarms; one layout makes it moot. |
| ED-084 | Wire crossings / bridges | KEEP | Accept | 2 | high | Crossing bridges make dense diagrams readable and are cosmetic in the drawing layer. Unverified. |
| ED-085 | Busbar port by drop position | REDESIGN | Accept | 2 | high | Drop-position busbar ports are replaced by net junctions and the busbar suggestion at three or more wires. Unverified. |
| ED-086 | Components palette in SIM hidden | REDESIGN | Accept | 2 | high | This is the Blue Grid sidebar swap; one persistent layout keeps the library visible. |
| ED-087 | Shake feedback | DROP | Accept | 2 | high | Shaking was Blue Grid feedback; a refused action instead gets a message in the problems panel with a fix. |
| ED-088 | Tutorial overlay | REDESIGN | Accept | 2 | high | A first-run checklist that never deletes the user's work replaces the 1,285-line overlay. |
| ED-089 | Language / direction of editing UI | REDESIGN | Accept | 2 | high | Hebrew first with message catalogs and RTL chrome; canvas stays LTR and numbers read left to right. |
| ED-090 | Project info (name, author, stamps) | REDESIGN | Accept | 2 | medium | Project name and modified stamp in Phase 2; the author field waits for identity in Phase 6. |
| CH-001 | EDIT / SIM modes | REDESIGN | Accept | 2 | high | Same finding as ED-001: one layout with a visible calculation overlay, no mode that clears state. |
| CH-002 | Component library sidebar (search, categories, multi-category, saved expand state, drag or click to add) | KEEP | Accept | 2 | high | Library with search, categories and drag or click to place is core, over the reduced catalog. |
| CH-003 | Component spec / help modal with live SVG preview | REDESIGN | Accept | 2 | medium | Help text generated from catalog records is cheap once the catalog exists and fits the Phase 2 editor. |
| CH-004 | Properties editor (per-component property forms, unit badges, validated inputs, textarea) | REDESIGN | Accept | 2 | high | Schema-driven forms from the catalog replace the 1,410-line hand-written editor. |
| CH-005 | Wires drawn port to port with orthogonal obstacle-avoiding routing | REDESIGN | Accept | 2 | high | Routing is kept as a drawing concern; the wire itself is the compound object with an ordered conductor list. Unverified. |
| CH-006 | Wire routing scoped to active subsystem | MERGE | Accept | 2 | high | Only a routing rule, and subsystems become a visual collapse, so it folds into CH-005. Unverified. |
| CH-007 | Wire waypoints (split, move, remove segments) | KEEP | Accept | 2 | high | Same behaviour as ED-018; manual waypoints stay. Unverified. |
| CH-008 | Direct vs routed wire mode (per wire or default) | MERGE | Accept | 2 | high | Direct versus routed is a per-wire option inside the routing feature (ED-017). Unverified. |
| CH-009 | Per-conductor cross-sections (phase, neutral, PE) and parallel cable count | REDESIGN | Accept | 2 | high | Conductor list on the compound wire, including parallel cable count, is the owner's wire model. |
| CH-010 | Stable wire IDs and migration pass | REDESIGN | Accept | 0 | high | Stable IDs and versioned migration are core model rules tested from Phase 0. |
| CH-011 | Cable and Protection Calculator (31 Israeli installation methods, A-G reference, PVC/XLPE, temperature, grouping, parallel cables) | REDESIGN | Accept | 1 | high | Re-derive sizing against the profile's tables in the Phase 1 engine; the 31 Israeli methods become profile data. |
| CH-012 | Zones (Location Zones): draw, name, colour | KEEP | Accept | 2 | high | Zones in Phase 2, consistent with ED-020; names feed location text in the switching order. Unverified. |
| CH-013 | Zone selection pane (hide, lock, reorder, rename) | KEEP | Accept | 2 | high | Same feature as ED-022; ships with zones in Phase 2. Unverified. |
| CH-014 | Subsystems: group, ungroup, nestable, mapped ports | REDESIGN | Accept | 4 | high | Subsystems become the visual collapse view, consistent with COMP-036 and ED-024. |
| CH-015 | Subsystem breadcrumb bar and double-click to enter | MERGE | Accept | 4 | high | Breadcrumbs and entering a group are part of the Phase 4 visual collapse over the full calculation. Unverified. |
| CH-016 | Subsystem port management (add/delete, auto internal connector) | MERGE | Accept | 4 | high | Port mapping becomes an automatic view of the net crossing the collapsed boundary, in Phase 4. Unverified. |
| CH-017 | Non-destructive ungroup and recursive delete with confirmation | MERGE | Accept | 4 | high | Ungroup is trivial when collapse is only a view; deletion is an undoable command, not a modal. Unverified. |
| CH-018 | Port integrity warning for unconnected subsystem ports | MERGE | Accept | 4 | medium | Unconnected-port warning becomes an advice rule in the problems panel. Unverified. |
| CH-019 | Graphic annotations: text (multiline, typography), rectangle, circle, arrow | KEEP | Accept | 2 | high | Text, rectangle, circle and arrow live in the annotation layer outside the electrical model. Unverified. |
| CH-020 | Graphic style editor (fill, stroke, radius, alignment, arrowheads) and 4-way/diagonal resize | KEEP | Accept | 2 | high | Annotation styling and resize belong with the Phase 2 annotation layer. Unverified. |
| CH-021 | Text stays upright when component rotated | KEEP | Accept | 2 | high | Electricians rely on upright text after rotation; keep it and test with bidi text. |
| CH-022 | Label styling (position, colours, size, zoom-independent) and per-property visibility flags | REDESIGN | Accept | 2 | high | Label and value visibility settings are useful; generate them as an appearance group from schemas. |
| CH-023 | Canvas pan/zoom, snap grid, grid/axis display, marquee, multi-select, copy/cut/paste | KEEP | Accept | 2 | high | Pan, zoom, snap grid, marquee, multi-select and copy, cut, paste are baseline editor behaviour; cut and paste go through commands and respect locks. |
| CH-024 | Keyboard shortcuts (Delete, R rotate, arrow nudge, context-smart Ctrl+A) | KEEP | Accept | 2 | high | Keep Delete, R, arrow nudge, Ctrl+A, Ctrl+C/X/V, Ctrl+Z/Y and add Esc to cancel a mode and a fit-all key. |
| CH-025 | Undo/redo with change detection and history cap | REDESIGN | Accept | 2 | high | Command log replaces whole-state snapshots; undo is a compensating command with no fixed depth of 50. |
| CH-026 | Context menus in edit and sim (group, delete, leakage, LOTO, grounding) | KEEP | Change to REDESIGN | 2 | high | Same feature as ED-033 and ED-050; edit menu in phase 2, simulation actions in phase 3, every item a real command. |
| CH-027 | New project button, project naming modal, recent projects list, delete from list | REDESIGN | Accept | 2 | high | Same flow as UI-001, UI-002 and ED-060; storage core in Phase 0, UI in Phase 2. |
| CH-028 | Landing / home screen with New, Import, tutorial | REDESIGN | Accept | 2 | high | Same feature as UI-001; consistent recommendation. |
| CH-029 | Project JSON save/load with author and modified-by metadata | REDESIGN | Accept | 0 | high | Save and load round trip is a Phase 0 exit gate; author metadata waits for identity. |
| CH-030 | Local autosave to browser storage | REDESIGN | Accept | 0 | high | Autosave behind the storage interface; same as ED-059. |
| CH-031 | Persisted UI preferences (sidebar and section state, alert filters) | KEEP | Accept | 2 | high | Remembering panel state and filters is a per-viewer convenience; keep it in browser storage. |
| CH-032 | Native user name stamped on projects | DROP | Accept | - | medium | Reading a native OS user name only works in Electron; identity returns with the edition adapters. |
| CH-033 | Light / dark theme | KEEP | Change to REDESIGN | 2 | medium | Same feature as ED-074, which is REDESIGN; the scanner's KEEP disagrees with it. Tokens and themes are rebuilt. |
| CH-034 | Accessibility settings (text scale 85-140%, high contrast, reduced motion) | REDESIGN | Accept | 2 | high | Same feature as ED-075 to ED-077 and UI-062, behind one appearance settings page. |
| CH-035 | Unified settings modal (accessibility and appearance + engine tabs) | KEEP | Accept | 2 | medium | One settings place for language, accessibility and appearance; calculation options live in the profile and console. |
| CH-036 | PNG snapshot of the diagram | MERGE | Accept | 3 | medium | Merge into the drawing export; whether PNG is offered at all is a product call. |
| CH-037 | Hebrew RTL UI | REDESIGN | Change to KEEP | 0 | medium | Hebrew RTL is a structural requirement from the i18n skeleton, so logical directions are used from the start. |
| CH-038 | Usage policy modal | REDESIGN | Accept | 2 | medium | Same feature as UI-065; Phase 0 has no UI, so it lands in Phase 2. Wording can sit in the design's risks until then. |
| CH-039 | Help center, Evolution Log (changelog) modal | KEEP | Change to REDESIGN | 2 | medium | Keep Help as one page; the changelog part follows UI-066 (LATER, link only). Row mixes two features. |
| CH-040 | Interactive guided tutorial (spotlight, topic modules, gated steps, skip) | REDESIGN | Accept | 2 | high | Same feature as ED-088: first-run guide by doing, skippable, never deleting work. |
| CH-041 | Splash/loading screen | KEEP | Accept | 0 | medium | A plain loading state is needed in the shell; no branding or organisation logo. |
| CH-042 | Single-click operation of switches in SIM, Ctrl+click select without operating | KEEP | Accept | 2 | medium | Click-to-operate is an editor interaction; the operating rules are engine Phase 1, so the click belongs with the Phase 2 editor. |
| CH-043 | LOTO (lock-out/tag-out) blocks operation | KEEP | Accept | 1 | high | Lock-out is a basic engine rule, enforced in switchingLogic.ts for components only; carry it in Phase 1 with the switch, and enforce it for wires too. |
| CH-044 | Interlocks (XOR mutual exclusion, AND prerequisite) | REDESIGN | Accept | 3 | medium | Interlock check belongs in the control-logic layer and must exist before the switching-order generator ships; the XOR is used in code, so the brief's claim is wrong. |
| CH-045 | No opening of disconnector under load: ARC fault | KEEP | Accept | 1 | high | Opening a disconnector under load is a core safety rule on a core-eight component; it also needs to feed the order generator. |
| CH-046 | Earth switch three positions, grounds bottom port only | KEEP | Change to MERGE | 1 | high | Same feature as COMP-020; earthing disconnector is a core component, so merge into the switch with an earthing capability, keeping the open-circuit rule. |
| CH-047 | Tripped devices reset only to open; RCD reset by click | KEEP | Accept | 1 | high | Trip resets only to open is a core breaker rule; the RCD click-reset part follows with the RCD in Phase 4. |
| CH-048 | Blocked-action feedback (shake, message) | REDESIGN | Change to DROP | - | medium | The shake is dropped (ED-087); the refusal message already comes from the problems panel (CH-096), so this row adds nothing. |
| CH-049 | Operational toolbox (LOTO, portable earthing, artificial fault, fuse replace, leakage, monitor) | KEEP | Accept | 3 | medium | Operator tools (lock-out, portable earth, artificial fault) are real work practice and feed the switching order; the toolbox UI lands with the documents phase. |
| CH-050 | Switching log (timeline, status pills, standardized Hebrew action text, zone attribution, manual rows, notes, import/export, clear) | REDESIGN | Accept | 3 | high | Log texts come from message catalogs, not Hebrew strings in logic; it feeds the Phase 3 switching order. |
| CH-051 | Switching order document (PDF/print, Word RTL, repeating header, page numbers, signature block, order number) | REDESIGN | Accept | 3 | high | Neutral configurable template with repeating header, page numbers and signature block; part of the first release. |
| CH-052 | Switching order from a rehearsed simulation sequence | MERGE | Accept | 3 | high | Switching order generation is a first-release document; merged into CH-051. |
| CH-053 | Load flow: voltages, currents, power (P, Q, S), power factor display | REDESIGN | Accept | 1 | high | Load flow with P, Q, S and power factor is in the first calculation gate and must be re-derived with traces. |
| CH-054 | Voltage drop (local, cumulative, % vs local nominal) | REDESIGN | Accept | 1 | high | Voltage drop is in the Phase 1 gate; it needs local and cumulative values with the profile limit. |
| CH-055 | Cumulative power losses | REDESIGN | Accept | 1 | medium | Cumulative losses follow directly from the same solve and belong with the Phase 1 load flow. |
| CH-056 | Per-phase (L1/L2/L3) monitoring of voltage, angle, current | REDESIGN | Accept | 1 | medium | Per-phase values on a balanced solver are acceptable if labelled as a balanced-model estimate, as the design states. |
| CH-057 | Impedance (R-X-Z) and power (P-Q-S) triangles | LATER | Accept | 4 | medium | Impedance and power triangles are an optional teaching visual on the trace; Phase 2 is already full with the editor. |
| CH-058 | Impedance-aware load sharing on meshes and parallel paths (admittance) | REDESIGN | Accept | 1 | high | Parallel-path current sharing comes naturally from the net-based nodal solve, so it needs no separate feature. |
| CH-059 | Iterative power-flow, mesh (Gauss-Seidel) solver, solver selector | REDESIGN | Accept | 1 | high | One iterative mesh solver in Phase 1 with no legacy fallback and no user-selectable solver. |
| CH-060 | Simplified vs detailed calculation mode | DROP | Accept | - | high | One calculation only; users cannot tell which numbers they are seeing in a simplified mode. |
| CH-061 | Reactive power and impedance chain (R/X, transformer %Z, source MVA) | REDESIGN | Accept | 1 | high | Impedance chain must be rebuilt with a known-answer 22 kV/0.4 kV test, since the transformer side error is unproven either way. |
| CH-062 | IEC 60909 style fault currents (Ik max, Ik min, c factors, temperature correction) | REDESIGN | Accept | 1 | high | Blue Grid uses one shortest path and fixed X/R; Flow Engine needs sequence networks with all sources, as the design says. |
| CH-063 | Earth-loop impedance Zs and Israeli protection check | REDESIGN | Accept | 1 | high | Earth-fault loop with disconnection time is in the Phase 1 gate and is under the standards profile. |
| CH-064 | Protection trip logic (overcurrent, fuse blow, over/under-voltage, source overload) | REDESIGN | Accept | 1 | medium | Instant breaker trip, voltage limits and source overload are Phase 1 (SIM-012, 015, 016); only curves and selectivity wait for Phase 4. |
| CH-065 | "Enable protections" toggle (also in simple mode) | REDESIGN | Accept | 1 | medium | Protection on or off must be an explicit visible setting shown with results, not a hidden flag. |
| CH-066 | Faults on cables generate short-circuit current | KEEP | Change to REDESIGN | 1 | medium | Cable-fault current in Blue Grid falls back to ik_max or a silent 1000 A default; it must come from the short-circuit calculation. |
| CH-067 | Electronic breaker with LSIG settings | REDESIGN | Change to MERGE | 4 | high | Owner says electronic breaker becomes a protection profile on the switch, not a separate type; keep L/S/I/G settings in the profile. |
| CH-068 | Trip delay and "impending trip" countdown with trip time shown | REDESIGN | Accept | 4 | high | Impending-trip countdown depends on time-current curves, which arrive in Phase 4. |
| CH-069 | TCC curve viewer (log-log, L S I G) with PNG save | REDESIGN | Accept | 4 | high | Curve viewer must be drawn from catalog device data with the protection and selectivity work. |
| CH-070 | RCD: leakage threshold, trip at >=, power cut when open or tripped | REDESIGN | Change to LATER | 4 | medium | Same feature as COMP-023; RCD is not in the core eight and needs earth-fault logic, so one consistent Phase 4 entry. |
| CH-071 | Leakage tool, leakage editor, purple indicator, cumulative leakage, header alert, gauge | REDESIGN | Accept | 4 | high | Leakage must sum upstream so an upstream RCD trips; Blue Grid reads only the component's own leakage (Protection.ts, LoadFlow.ts). |
| CH-072 | Island decomposition and signature-gated re-solve | REDESIGN | Accept | 1 | high | One solver per power island is the design; port expected numbers, not code or the signature cache. |
| CH-073 | Engine in a Web Worker with fallback | KEEP | Accept | 1 | high | Worker keeps the UI responsive and the coalescing protocol is sound; build it in the Phase 1 engine. |
| CH-074 | Spatial culling and zoom-dependent detail levels | KEEP | Change to REDESIGN | 2 | medium | Same feature as ED-044; keep the spatial index and detail levels but redo them for the SVG then canvas rendering. |
| CH-075 | Phase splitter (3-phase to 1-phase R/S/T) | REDESIGN | Change to DROP | - | high | The phase splitter disappears once wires split into conductors; single-phase loads connect to one conductor. |
| CH-076 | Mixed AC 3-ph, AC 1-ph, DC with colours (DC blue) | REDESIGN | Accept | 1 | high | Power types drive separate solvers; colours are redefined with red kept for alarms. |
| CH-077 | Converters: inverter, rectifier, DC/DC, VFD, efficiency | MERGE | Accept | 4 | high | Owner merges inverter, rectifier, DC-DC and VFD into one converter; Phase 4 with DC support is right. |
| CH-078 | Input and output power/current shown separately for converters and transformers | KEEP | Accept | 1 | high | Showing input and output power across transformers and converters exposes losses and is cheap once solved. |
| CH-079 | Transformer (ratio, vector group, %Z, losses, phase shift) | REDESIGN | Accept | 1 | high | Transformer is core; ratio, vector group and impedance side need real reference cases instead of regex parsing. |
| CH-080 | Grid with short-circuit MVA | KEEP | Accept | 1 | high | Grid is core; replace the 999999 MVA student default with an explicit entered short-circuit level. |
| CH-081 | Generator with fuel, drift, sync | REDESIGN | Change to KEEP | 1 | high | Generator is core (COMP-002 says Phase 1); only fuel and synchronising logic wait for Phase 4. |
| CH-082 | Fuel simulation toggle, fuel tank, shutdown when empty | LATER | Accept | 4 | high | Fuel simulation is not core; keep as Phase 4 with an ID link replacing the string link. |
| CH-083 | Synchronizer (phase/frequency/voltage progress, can target inverters) | REDESIGN | Accept | 4 | high | Synchroniser folds into the control-logic layer after the core eight work. |
| CH-084 | ATS, ATS controller (state machine, delays, sequences) | REDESIGN | Accept | 4 | high | ATS and its controller duplicate each other and become one control-logic feature. |
| CH-085 | UPS and DC UPS (state machine, battery, bypass, backup time, sidebar panel) | REDESIGN | Change to MERGE | 4 | medium | Same as COMP-010/011: UPS is a template over converter, battery and bypass, keeping the mode behaviour electricians rely on. |
| CH-086 | Battery bank (SOC, charge, time remaining), PV array, EV charger toggle | KEEP | Change to LATER | 4 | medium | Battery, PV and EV are not core; align with COMP-003/004 as Phase 4, and EV charger merges into load. |
| CH-087 | Current stabilizer (CCR): input type, two-output option, efficiency, open-circuit TRIP | REDESIGN | Accept | 4 | high | CCR is a series-loop power type with compliance voltage and real open-circuit detection, not a component quirk. |
| CH-088 | Light, horn, current load as constant-impedance loads | MERGE | Accept | 4 | high | Light, horn and current load merge into the single load; constant-impedance behaviour matters for series loops in Phase 4. |
| CH-089 | Fuse, blowable | KEEP | Accept | 4 | medium | Fuse is not in the core eight and its curve belongs with protection and selectivity in Phase 4; match COMP-022. |
| CH-090 | Busbar (variable width/ports), combiner box, pole, SPD, connector (wireless address) | REDESIGN | Accept | 1 | high | Busbar and connector are modelled in the Phase 1 topology; combiner becomes a DC busbar and SPD and pole are dropped. Unverified. |
| CH-091 | Load-balance module: monitored components, time-weighted avg/max, diversity factors | REDESIGN | Accept | 4 | medium | Static load aggregation with diversity factors is the design's view over the full calculation; live monitoring is not carried over. |
| CH-092 | Load-balance report (hierarchy, reserve, imbalance, status, panel summary; print/Word/Excel) | REDESIGN | Accept | 4 | medium | Report carries hierarchy, planned versus simulated, reserve, per-phase imbalance and shown formulas; needs Phase 4 aggregation. |
| CH-093 | Design-mode load report in EDIT | MERGE | Accept | 4 | high | Design-mode load report is the same feature as the load aggregation view. |
| CH-094 | Monitoring badge, live load meters, 80% / 100% load alerts | MERGE | Accept | 4 | medium | Keep the 80% and 100% loading warnings as advice rules in the problems panel; drop the live meters and monitoring badge. |
| CH-095 | Component load graph modal | LATER | Change to DROP | - | low | Per-component load history needs the dropped time-series monitoring (see SIM-043). Your call. |
| CH-096 | System alerts log (toast, severity filters, locate, remove, Excel export) | REDESIGN | Accept | 2 | high | The problems panel replaces Blue Grid's alert log; severity filter and locate stay, Excel export is optional. |
| CH-097 | Zoom-to-component from an alert | MERGE | Accept | 2 | high | Click-to-select and zoom to the offending element is part of the problems panel. |
| CH-098 | Live tooltip with current in trade notation (3x100A, 1x30A, 50A(DC)) | KEEP | Accept | 2 | high | Electricians read currents in 3x100A notation; tooltip should also link to the calculation trace. |
| CH-099 | Animated power flow on wires with phase colour | REDESIGN | Change to LATER | 4 | medium | Same feature as ED-080, which defers animation to Phase 4; static energised colouring comes with results display. Unverified. |
| CH-100 | SIM sidebar sections (collapsible, hero status card, UPS/battery/fuel/sync widgets) | REDESIGN | Accept | 2 | medium | Results detail moves into the one persistent layout and trace view; separate Simulate sidebar widgets are not carried over. |
| CH-101 | Calculation display toggles (show current, voltage, power) | KEEP | Accept | 2 | medium | Choosing visible values is useful; the toggles must not hide numbers a trace needs. |
| CH-102 | Phone view and simulate mode (bottom action bar, sheets, header menu) | LATER | Accept | 6 | high | Read-only phone viewing later; the simulate controls and bottom action bar are not carried over. |
| CH-103 | Touch gestures (pan, pinch, long-press) and discard of leftover tap after gesture | LATER | Accept | 6 | medium | Touch is later and read-only; keep the rule that a trailing click after a gesture never operates a breaker. |
| CH-104 | Electron desktop app, portable EXE, single-instance lock | LATER | Accept | 6 | high | Electron is optional and later; the single-instance lock is a platform detail. |
| CH-105 | Standalone single-file HTML (offline, bundled assets) | LATER | Accept | 6 | medium | Offline use comes with the long-term-support edition as an installable web app; a single-file build is a distribution choice. |
| CH-106 | Automated test suite and Playwright e2e | REDESIGN | Accept | 0 | high | Tests and CI rules are a Phase 0 requirement; Playwright e2e grows with the editor in Phase 2. |
| CH-107 | Engine verification report | DROP | Accept | - | high | A review process document, not an app feature; verification lives in the reference cases. |
| COMP-001 | GRID | KEEP | Accept | 1 | high | Grid is a core component; default must be an entered value, not an infinite bus. |
| COMP-002 | GEN (generator) | KEEP | Accept | 1 | high | Generator is core; fuel and sync logic follow in Phase 4 and the duplicated validate logic is not carried over. |
| COMP-003 | PV_ARRAY | LATER | Accept | 4 | high | PV array is outside the core set and needs DC support; Phase 4 is right. |
| COMP-004 | BATTERY_BANK | LATER | Accept | 4 | high | Battery bank needs DC and charge state; Phase 4, and the UPS should reuse it instead of a hidden battery. |
| COMP-005 | TRANSFORMER | REDESIGN | Accept | 1 | high | Transformer is core; redesign removes the regex vector group and the fixed 0.98 efficiency, using IEC 60909 impedance correction. |
| COMP-006 | INVERTER | MERGE | Accept | 4 | high | Owner merges inverter into one converter; Phase 4. |
| COMP-007 | RECTIFIER | MERGE | Accept | 4 | high | Owner merges rectifier into one converter; fixed 1.35 and 0.9 factors become a stated assumption. |
| COMP-008 | DCDC_CONVERTER | MERGE | Accept | 4 | high | Owner merges DC-DC into one converter; Phase 4. |
| COMP-009 | VFD | MERGE | Accept | 4 | high | Owner merges VFD into one converter; frequency control becomes a converter mode. |
| COMP-010 | UPS | MERGE | Accept | 4 | medium | UPS becomes converter plus battery plus bypass; removes the hidden duplicate battery. |
| COMP-011 | DC_UPS | MERGE | Accept | 4 | medium | DC UPS is the same composition with a DC output, so it merges with the UPS template. |
| COMP-012 | LOAD | KEEP | Accept | 1 | high | Load is core and becomes the single load with kVA, amps and operational-flag modes. |
| COMP-013 | CURRENT_LOAD | MERGE | Accept | 1 | high | Owner merges current load into load; loadBalance.ts does read its target current, so keep the amps mode. |
| COMP-014 | LIGHT | MERGE | Accept | 4 | high | Owner merges light into load as a symbol; only series-loop use needs Phase 4 behaviour. |
| COMP-015 | HORN | MERGE | Accept | 4 | high | Owner merges horn into load as a symbol; no real behaviour difference. |
| COMP-016 | EV_CHARGER | LATER | Change to MERGE | 4 | medium | A switchable AC or DC consumer is a load with a type match; merge into load rather than keeping a fourth consumer type. |
| COMP-017 | BREAKER | MERGE | Accept | 1 | high | Owner merges breaker into one switch with a capability set; breaker is core, so Phase 1. |
| COMP-018 | LOAD_BREAKER | MERGE | Accept | 1 | high | Load-break switch is a switch with load-break but no short-circuit capability; owner merges it. |
| COMP-019 | DISCONNECTOR | MERGE | Accept | 1 | high | Merge into switch; keep the no-open-under-load rule but drop the permanent isFaulted arc hack and per-type sqrt(3) use. |
| COMP-020 | EARTH_SWITCH | MERGE | Accept | 1 | high | Earthing disconnector is core; merge as a switch with earthing capability, keeping the open-circuit rule from the earthed side. |
| COMP-021 | ELECTRONIC_BREAKER | REDESIGN | Accept | 4 | high | Becomes a protection profile on the switch, with LSIG curves arriving with protection and selectivity. |
| COMP-022 | FUSE | KEEP | Accept | 4 | medium | Fuse stays as its own type with a time-current curve, which fits Phase 4 protection work. |
| COMP-023 | RCD | LATER | Accept | 4 | medium | RCD stays; leakage must be summed from downstream, so it needs the Phase 4 earth-fault logic. |
| COMP-024 | BUSBAR | REDESIGN | Accept | 1 | high | Busbar is core and becomes a net with a rating rule instead of a user-set port count. |
| COMP-025 | COMBINER_BOX | MERGE | Accept | 4 | high | Owner merges combiner box into a DC busbar; it has no physics of its own. |
| COMP-026 | PHASE_SPLITTER | REDESIGN | Change to DROP | - | high | Owner says phase splitter disappears once wires split into conductors; compound wire (Phase 2) replaces it. |
| COMP-027 | CURRENT_STABILIZER | REDESIGN | Accept | 4 | high | Constant-current regulator becomes a series-loop source; the dead open-circuit trip path is not carried over. |
| COMP-028 | SYNCHRONIZER | REDESIGN | Accept | 4 | high | Folds into the single control-logic layer, with node references instead of string id lists. |
| COMP-029 | INTERLOCK | REDESIGN | Accept | 3 | medium | Interlocks must exist when the switching order ships (Phase 3); XOR is read in switchingLogic.ts, so the brief's claim is wrong. |
| COMP-030 | ATS_CONTROLLER | REDESIGN | Accept | 4 | high | Merges with ATS into one control-logic feature; mains availability must not be 'first grid is on'. |
| COMP-031 | ATS | MERGE | Accept | 4 | high | Merge into the control-logic layer; delay and cooldown properties were unused by the engine. |
| COMP-032 | CONNECTOR | REDESIGN | Accept | 2 | medium | Off-page connector stays as a net label bound by ID, not by label text; fits the net-based model. |
| COMP-033 | SPD | DROP | Accept | - | high | Owner drops SPD as a simulated part; it has no physics in Blue Grid. |
| COMP-034 | POLE | DROP | Accept | - | high | Owner drops pole; no physics, and a waypoint on a wire covers any drawing need. |
| COMP-035 | FUEL_TANK | LATER | Accept | 4 | high | Fuel tank is only needed with generator fuel simulation; Phase 4 with an ID link. |
| COMP-036 | SUBSYSTEM | REDESIGN | Accept | 4 | high | Owner wants visual collapse as a view over the full calculation, not a model-rewriting container; Phase 4. |
| COMP-037 | RECTANGLE (graphics) | KEEP | Accept | 2 | high | Annotation shapes sit outside the electrical model and are needed once the editor exists. |
| COMP-038 | CIRCLE (graphics) | KEEP | Accept | 2 | high | Annotation layer shape, per owner decision; Phase 2 editor. |
| COMP-039 | TEXT (graphics) | KEEP | Accept | 2 | high | Annotation text is needed in the editor; it stays outside the electrical model. |
| COMP-040 | ARROW (graphics) | KEEP | Accept | 2 | high | Annotation arrow, per owner decision; Phase 2 editor. |
| SIM-001 | Energisation by BFS from sources | REDESIGN | Accept | 1 | high | Replace first-wire-wins BFS with net derivation and one solver per island. |
| SIM-002 | Source set and gating | KEEP | Accept | 1 | high | Source gating by state is correct; grid and generator are core, battery and UPS follow in Phase 4. |
| SIM-003 | Open, tripped, blown and grounded devices stop propagation | KEEP | Accept | 1 | high | Open, tripped, blown or grounded devices stopping power is basic behaviour for the core switch types. |
| SIM-004 | Source collision / paralleling check | KEEP | Accept | 1 | medium | Source collision check is needed with grid plus generator; tolerances should be profile settings with a cited basis, not bare constants. |
| SIM-005 | Dead-island pruning | KEEP | Accept | 1 | high | De-energising downstream of a faulted or open element is expected and falls out of net connectivity. |
| SIM-006 | Island decomposition and result cache | REDESIGN | Accept | 1 | high | Island decomposition is the design's solver structure; port expected numbers, rewrite the code. |
| SIM-007 | Load aggregation upstream | REDESIGN | Accept | 1 | high | Roll-up needs real per-device efficiency, not the fixed 0.98; the aggregation view is Phase 4. |
| SIM-008 | Per-phase current and unbalance | REDESIGN | Accept | 1 | high | Phase attribution becomes explicit through conductors instead of defaulting to phase 1; keep the estimate label. |
| SIM-009 | Voltage drop and losses | KEEP | Change to REDESIGN | 1 | high | Voltage drop must be re-derived with traces and no silent cable defaults, not kept as the Blue Grid code. |
| SIM-010 | Fault current (IEC 60909) | KEEP | Change to REDESIGN | 1 | high | Blue Grid uses one shortest path, fixed X/R of 10 and 5, and a doubted transformer impedance; it needs full IEC 60909 in Phase 1. |
| SIM-011 | Applied fault (component or wire) | REDESIGN | Accept | 1 | medium | Applied faults are useful for training; the fault current must come from the calculation, not a 1000 A default. |
| SIM-012 | Breaker overcurrent trip | KEEP | Accept | 1 | high | Instant overcurrent trip on the core breaker is Phase 1; curves follow later. |
| SIM-013 | Fuse blow | KEEP | Accept | 4 | high | Fuse is outside the core eight; keep blow and replace-to-restore behaviour when the type arrives. |
| SIM-014 | RCD leakage trip | REDESIGN | Accept | 4 | high | Confirmed gap: leakage is not summed upstream, so an RCD upstream of a leaking load never trips; fix in redesign. |
| SIM-015 | Voltage limit errors | KEEP | Accept | 1 | high | Over- and under-voltage limits are in the first gate, with thresholds from the standards profile. |
| SIM-016 | Source and capacity overload | KEEP | Accept | 1 | high | Source overload against capacity is an expected diagnostic on grid and generator. |
| SIM-017 | Tripped and blown status text | KEEP | Accept | 1 | high | Tripped devices must be shown as de-energised with the trip cause as a diagnostic code. |
| SIM-018 | CCR open-circuit trip | LATER | Change to DROP | - | high | Trigger string is set nowhere in simulation/ (Protection.ts:55), so it is dead code; open-circuit detection is covered by SIM-019 and CH-087. |
| SIM-019 | Series constant-current section | LATER | Accept | 4 | high | Series constant-current loop is a Phase 4 power type with its own solver. |
| SIM-020 | Radial and mesh solvers | REDESIGN | Accept | 1 | high | One solver per power island with no legacy fallback; unsolvable cases produce a visible diagnostic. |
| SIM-021 | Solver choice, cadence and worker settings | REDESIGN | Accept | 1 | medium | Drop the legacy solver option; keep worker protocol and cadence, with settings visible. |
| SIM-022 | Worker coalescing protocol | KEEP | Accept | 1 | high | One solve in flight with latest-wins coalescing is a sound protocol worth carrying. |
| SIM-023 | Calculation display options | REDESIGN | Accept | 1 | medium | Display toggles stay as view options, but filtering alerts by message text must not carry over. |
| SIM-024 | Manual switching rules | KEEP | Accept | 1 | high | Toggle rules and trip-resets-only-to-open are core switch behaviour electricians rely on. |
| SIM-025 | Lock-out / tag-out | KEEP | Accept | 1 | high | Lock-out is a real feature; enforce it for wires too, since the wire lock flag is set but unchecked in the engine. |
| SIM-026 | Interlock check | REDESIGN | Accept | 3 | medium | Interlock check is needed once the switching order is generated; the core eight need none in Phase 1. |
| SIM-027 | Arc on opening a disconnector under load | KEEP | Accept | 1 | high | Opening a disconnector under load must block and fault; add an explicit repair or reset path, since the fault latches. |
| SIM-028 | Earth switch 3-position cycle | KEEP | Accept | 1 | medium | Closed, open, grounded cycle is the earthing disconnector's behaviour and it is a core-eight component. |
| SIM-029 | Switching log and order | REDESIGN | Accept | 3 | medium | Order is generated from rules by a neutral template, with the live action log kept as a separate record. |
| SIM-030 | Synchroniser | LATER | Accept | 4 | high | Synchroniser belongs to the control-logic layer after the core components. |
| SIM-031 | Sync releases interlock and closes switches | LATER | Accept | 4 | high | Sync release of interlock and auto-close is control logic, done with the layer in Phase 4. |
| SIM-032 | Generator drift | LATER | Change to DROP | - | low | Drifting generator voltage and frequency is animation realism, not engineering output; a static calculation tool does not need it. |
| SIM-033 | Fuel consumption and shutdown | LATER | Accept | 4 | medium | Fuel runtime is useful for generator sizing; keep as an optional later view tied to a tank link. |
| SIM-034 | ATS sequence | LATER | Accept | 4 | high | ATS sequence is control logic; the mains-availability test must not be 'first grid is on'. |
| SIM-035 | UPS behaviour | LATER | Accept | 4 | high | UPS states and battery runtime come with the Phase 4 component set. |
| SIM-036 | Battery SoC integration | LATER | Accept | 4 | high | Battery state-of-charge integration follows the battery component in Phase 4. |
| SIM-037 | Electronic breaker LSIG | LATER | Accept | 4 | medium | LSIG curves belong with protection profiles; the inverse-time formula and 5% pickup need checking against the standard. |
| SIM-038 | Trip effects | REDESIGN | Accept | 1 | high | Engine returns trip intents and the UI applies them; shake animation is a UI choice. |
| SIM-039 | Alert categories | REDESIGN | Accept | 1 | high | Diagnostics carry codes and parameters so Hebrew and English text is built at the UI edge. |
| SIM-040 | Network error and overload alerts | KEEP | Accept | 1 | high | Node errors and overload warnings at over 100% are core diagnostics in the problems panel. |
| SIM-041 | Load-balance threshold alerts | LATER | Accept | 4 | medium | Loading-percentage alerts come with the load aggregation view; basic overload is already in SIM-040. |
| SIM-042 | UPS and load power-loss alerts | LATER | Accept | 4 | medium | UPS and loss-of-feed alerts follow the UPS and load-criticality features. |
| SIM-043 | Load monitoring | LATER | Change to DROP | - | low | Time-weighted sampling of a live rehearsal does not fit a static calculation; load aggregation covers design loading. |
| SIM-044 | Load history trace | LATER | Change to DROP | - | low | A one-hour ring buffer of rehearsal samples has no basis in the static calculation model and is never persisted. |
| SIM-045 | Load basis rules | KEEP | Accept | 4 | medium | A defined load basis (Ir, In, or kVA) is needed for loading percentages and aggregation. |
| SIM-046 | Load-balance report | LATER | Accept | 4 | medium | Load-balance report with diversity and phase imbalance is the aggregation view in Phase 4; unverified report component. |
| SIM-047 | Subsystem virtual wires and port check | REDESIGN | Accept | 4 | high | Label-matched ports are fragile; the visual collapse should bind ports by node reference. |
