# Stage 7: Critic Review

**Target:** `docs/designs/flow-engine.md`, FeatureRange lines 1-512. **Reviewers:** `egm-design` (standard: `feature-spec-standard`), `egm-structural` (standard: `feature-spec-standard`), `egm-style`. All completed. Findings are condensed to one entry each. Severity is the reviewer's.

## Reviewer status

| Reviewer | Status |
| --- | --- |
| `egm-design` | completed |
| `egm-structural` | completed |
| `egm-style` | completed |

## Design critic findings

| ID | Severity | Scope | Finding |
| --- | --- | --- | --- |
| D1 | Major | Alternatives Rule | For F, H and K to T the reason is only "Not selected by author", which the document admits gave no reason. The standard requires specific documented reasons. A, F and H say "rejected by author" with no linked decision. State the decisive technical criterion per entry and link the decision record, or mark the choice undecided. Quantify the "becomes the better choice if" triggers. |
| D2 | Major | Missing alternatives | No alternative to event sourcing as the saved format (plain document plus revision history, or SQLite or IndexedDB). No alternative for the engine's runtime location (server-side, or WebAssembly from a verified library). No desktop wrapper choice (Electron, Tauri or none). No alternatives for the save container. |
| D3 | Major | Open Questions vs body | "None" conflicts with pointers at lines 263 and 449 and the Phase 6 gate. The "decisions made while drafting" were self-delegated and read closer to unreviewed assumptions than decisions. |
| D4 | Nit | Risks and Limits | Several risks have no mitigation (scope, zero-sequence data, standards licensing). Security is absent. |
| D5 | Major | Problem section, transformer claim | The effect is stated as "understate fault current by a large factor" though the claim was found by reading. The reviewer notes that `VoltagePropagation.ts` around line 238 correctly scales upstream impedance, and asks for one 22 kV to 0.4 kV case to be run before the claim stays in the Problem and Alternative D. **Elephant check:** the correct scaling the reviewer cites applies to the upstream chain. The transformer's own impedance is computed at the input voltage (`registry.ts` lines 56-58) and added unscaled (`VoltagePropagation.ts` lines 253-257). The claim holds by reading and remains unexecuted. |
| D6 | **Blocker** | Balanced solver | The method for per-phase and neutral estimates from a balanced positive-sequence result is not given, and positive-sequence results carry no neutral information. Goal 6 and Phase 1 include earth-fault loop and minimum phase-to-earth short circuit, which need zero-sequence or loop impedances, and the design admits that data is often missing. A label does not protect a user who sizes a neutral or PE conductor from the result. State the method and its error bound, or exclude neutral and loop sizing from Phase 1 and make Alternative K the default for those results. |
| D7 | Major | CUJ 3 | The simulation "uses the per-conductor data" but a positive-sequence solver cannot use the PE conductor except through the earth-fault loop. Spell out which conductors feed which calculation. |
| D8 | Major | IEC 60909 scope | Missing voltage factor c, correction factors KT and KG, conductor temperature for the minimum case, peak factor and breaking current. The first component set has no motor, but motor contribution is part of the standard. DC faults need IEC 61660 and series loops have no standard. Add a per-power-type table of which calculation, which standard, and which "not supported" result. |
| D9 | Major | Reference tests | The Israeli default profile has references only from the owner's hand calculations, and the owner is also author and sole signer-off. IEC TR 60909-4 and IEEE networks do not cover LV earth loops or Israeli rules. Copying worked-example numbers may raise a licensing question. The 1 percent and 0.1 percent tolerances have no derivation. Recommends an independent second engineer or a commercial-tool cross-check before "verifiable" is claimed publicly, and a statement of who carries liability. |
| D10 | Major | Performance | No target project size or latency budget. A dense complex matrix at 10,000 nodes needs about 1.6 GB. Meshed load flow needs a Jacobian. Convergence criteria and caps have no values. A synchronous dense solve cannot be cancelled except by terminating the worker. Boundary iteration has no damping or ordering strategy. Floating-point results can differ across browsers. |
| D11 | Major | Event log | Migration rewrites old commands and compaction replaces spans, which conflicts with using the log as the sync unit and with the claim that merging must remain possible. Line 42 and line 263 disagree on where revision data lives. Snapshots at every save grow the file with no retention rule. A 20 MB file parsed as one JSON on the main thread is a latency and crash-safety risk. Atomic write and recovery are not specified. Browser storage options are not examined (File System Access API gaps, IndexedDB quotas). The log's `author` field and history leak work history on sharing. |
| D12 | Major | Cloud lock | A project lock has no lease, heartbeat or expiry. It conflicts with offline editing. No threat model, tenant isolation, encryption at rest, or data-protection plan (Israeli privacy law, GDPR). |
| D13 | Major | Client security | Licence checks run in client code and can be removed, which for the web trial is the main revenue gate. Imported files, DXF and price lists need size and depth limits. Spreadsheet export of labels is open to formula injection. SVG labels must never be injected as markup. A desktop wrapper needs a content security policy and a restricted bridge. |
| D14 | Major | Legal | Standards tables ship in the core `catalog`, and a failed legal check would force replacing the data layer. This is architectural, so design a path for user-supplied tables. Dependency licences are not inventoried (DXF writer, spreadsheet and PDF libraries, fonts, ETIM attribution). Dekel labels may be protected. No intended-use or liability statement. |
| D15 | Major | Hebrew output | The Phase 2 prototype checks SVG labels only. Canvas bidi is weaker and DXF right-to-left text differs across CAD programs. Extend the prototype to canvas, DXF and PDF. |
| D16 | Nit | Circuits | Auto-derivation is undefined for meshed or parallel feeders, and the fate of user-edited circuits after a network change is undefined. |
| D17 | Nit | Busbar threshold | "Confirmed at finalization" against a brief that gave no number reads as circular justification. |
| D18 | Nit | Delivery | No effort estimate for the first release. A tool with no screen until Phase 2 gets no user feedback. Consider a thin vertical slice in Phase 1. |

Must fix before approval, per the reviewer: D6, then D1, D3, D5, D8, D9, D11, D13, D14.

## Structural findings

Heading hierarchy has no skipped levels. Template order is correct. Both code fences are balanced and every table has a consistent column count. Alternatives A to T each have Pros, Cons and Reason for Rejection.

| ID | Severity | Scope | Finding |
| --- | --- | --- | --- |
| ST1 | Major | Lines 173 and 441 | Line 173 says "These five" decisions but the heading at 441 says "four architecture decisions". There are five. |
| ST2 | Major | "Decisions made while drafting" | About 20 long bullets in the Overview, against a template that calls for a concise Overview. Licence tampering repeats the offline-licence entry, and reference-case review repeats part of the test-sources entry. Line 37 refers to open questions that no longer exist. Move the entries or remove duplicates. |
| ST3 | Major | Links | `docs/research/boq_options.md` and `concepts_brief.md` are plain backticked paths, not Markdown links, and resolve only against the repository root. Convert to relative links (`../research/boq_options.md`, `../../concepts_brief.md`) as `docs/designs/README.md` does. |
| ST4 | Nit | Line 63 | Blue Grid paths are unqualified. Prefix with "Blue Grid v0.87:". |
| ST5 | Nit | Line 357 | `CLAUDE.md` does not exist yet. Say "(to be created)". |
| ST6 | Nit | Separators | The template puts a rule after Alternatives. Add one before the Detailed Implementation Plan. No Non-Functional Requirements section exists, and security and performance appear only in Risks. |
| ST7 | Nit | Pseudo-headings | Bold lead-ins in The Problem act as headings. Numbered goals use mixed spacing. |
| ST8 | Nit | Alternatives depth | A to J are H3, K to T are H5 under H3 and H4. Valid, but differs from the template. |

## Style findings (FeatureRange)

Spot checks against Blue Grid: one commit, no `.github` folder, no `strict` in the TypeScript config, 1.5 mm² and 100 m defaults, and transformer impedance computed from `input.voltage`. All are consistent. A rough grep found 186 test cases, against the design's 187.

| ID | Severity | Scope | Finding and action |
| --- | --- | --- | --- |
| SY1 | Major | The Problem, lines 61-68 | The preamble says "by reading" items were not executed, but only one bullet carries the mark. Single shortest path, breaking capacity never compared, instant tripping, silent solver takeover and the above-zero test are also read from source. Action: CALIBRATE. Say none were executed, cite file and line per bullet, and replace "a large factor" with a hand-computed ratio or drop it. Align line 63 and line 402. |
| SY2 | Major | Line 68 | "187 test cases" is 186 by the reviewer's count. "Mostly self-agreeing" is unquantified. Give the counting method and name the trivially passing test. |
| SY3 | Major | Lines 81 and 384 | The three-file list omits the 1,285-line tutorial overlay. Name the files or say "800 to 1,400 lines". |
| SY4 | Nit | Lines 75, 79, 81 | "Well over 100 places", "over a dozen places" and "over 100 files" are unverified counts. State the measured number and method. |
| SY5 | Major | Lines 33 and 403 | "Port the test numbers" sits beside "tests mostly self-agree". State which numbers are ported and how they are validated. |
| SY6 | Major | Lines 37-55 | Many entries repeat the Goals, Non-Goals and Risks sections. Drop repeats and keep one location each. The standards legal note should keep one copy, in Risks. |
| SY7 | Nit | Line 47 | Competitor names from the name search are trivia. State the decision only. |
| SY8 | Nit | "Fails if" clauses | The licence-tampering hedge, "projects grow too large" with no threshold, and "still slow" with no number need action: DROP or CALIBRATE with the 20 MB trigger and a load-time target. |
| SY9 | Nit | Lines 37 and 99 | "The owner can reverse any of them" and "can change them" are standing truths. Keep one statement. |
| SY10 | Nit | Lines 123-125 | "Questions raised by later review are added here" is a procedural promise. Drop it. Point the stale pointers at the decision entries. |
| SY11 | Nit | Subjective wording | "Useful ideas", "teaches its own rules", "a rule nobody wrote down", "patched by hand" and "carries the cost of its growth" are narrative or pejorative. State the observable fact. |
| SY12 | Nit | Slogans | "Resists patching" (Goal 16), "Real numbers is a promise" and "The plan is large" are slogans or vague. State counts. |
| SY13 | Nit | Goal 1 | "At least part of the reference set comes from outside" has no measurable minimum. |
| SY14 | Nit | Redundancy | Lines 383-385 repeat the concept-review support. Line 169 duplicates line 325. |
| SY15 | Nit | Line 385 | The owner's reason is quoted as fact. Attribute it. |
