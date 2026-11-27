# Bill of Quantities: Options and Proposed Design

* **Date:** 2026-11-27
* **Status:** Proposal for owner review. Research from public web pages only; nothing here was tested or contacted.

## The question

How should Flow Engine build a bill of quantities (BoQ), and where do part data and prices come from? Is there a free catalog?

## Short answer

1. **There is no free catalog of priced Israeli electrical parts that I could find.** Free data exists for *what a part is* (classification and technical attributes). Data for *what it costs* is paid, private, or belongs to the user.
2. **Do not ship prices.** Ship the mechanism: quantities come from the project model, part identity comes from an open classification, and prices come from price lists that the user owns and imports.
3. **Version 1 should work with generic items** (for example "MCCB, 3 pole, 160 A, 25 kA") plus user-imported price lists. Manufacturer catalogs are optional connectors added later.

## What the research found

| Source | What it gives | Cost and terms | Fit |
| --- | --- | --- | --- |
| [ETIM classification](https://www.etim-international.com/?p=1811) | A free classification of electrical products with standard attributes (for example, a circuit breaker class with rated current, poles, breaking capacity) | Open Data Commons Attribution licence: free to use, must credit ETIM | **Strong fit for part identity.** Gives every BoQ line a standard class and attributes without a brand. Free browsing in the [ETIM Viewer](https://viewer.etim-international.com/about). |
| [ETIM xChange](https://www.etim-international.com/?p=1811) | A JSON format for exchanging product catalogs from manufacturers to wholesalers | Apache 2.0 | **Good import format** if a supplier sends a catalog. A [REST wrapper exists](https://product-data-openapi.2ba.nl/) (terms not checked). |
| [ECLASS](https://eclass.eu/en/eclass-standard/prices) | A similar classification, strong in Germany | Mixed: some releases free for registered users and research, commercial licences paid, prices depend on company size. The sources I found disagree on dates, so check the shop | **Second choice.** ETIM is simpler and free for this use. |
| [Schneider Electric Product Catalog API](https://api-explorer.se.com/en/api/product-catalog-v2) | Technical product data with ETIM classification, per manufacturer | OAuth login. Aimed at distributors and partners. I did not find the terms for a software vendor | **Possible later connector.** Needs Schneider's approval and terms checked. |
| [ABB data exchange](https://new.abb.com/low-voltage/fr-be/support/e-business/data-exchange) | Article files with ETIM specifications and images (ETIM 8/9, BMEcat) | Terms not checked | **Possible later connector.** |
| Siemens | I found no product-data API for breakers | Unknown | Check Siemens directly before assuming. |
| [EPLAN Data Portal](https://www.eplan.com/int/en/support/data-portal.html) | Device data from about 500 manufacturers, in EPLAN's own format | Free with an EPLAN cloud account, but built for use inside EPLAN. I found no public developer API | **Not a source for Flow Engine** without EPLAN's agreement. |
| Open-source part databases (for example [JITx](https://github.com/JITx-Inc/open-components-database)) | Mostly electronics parts for circuit boards | Open licences | **Not useful.** They do not cover breakers, cables or transformers. |
| [Dekel price list](https://www.gov.il/BlobFolder/rfp/ng-260825/he/appendix-d-dekel.pdf) (דקל) | The common Israeli construction price list. Electrical installations are chapter 08, mainly as subcontractor rates | Licensed. Public tender documents reference it and apply discounts, but I could not find the price or terms for a licence | **Used for pricing in Israeli tenders, but not free.** Treat it as a user-supplied price list. |

Tender documents I found price work not listed in the BoQ at the Dekel rate minus 10, 15 or 20 percent. That convention should be supported as a setting.

### What I could not find

* The cost of a Dekel licence, whether it can be used through software, and whether an export (for example from Remador) exists.
* Any Israeli distributor or wholesaler that shares product data in ETIM or another open format.
* Licence terms for using manufacturer APIs inside a commercial product.
* Whether cable manufacturers publish usable open data.

## Proposed design

### Three separate layers

1. **Quantities** (derived, never typed): counted and measured from the project model.
2. **Item identity** (open): each line has a class (ETIM) and attributes (rating, poles, breaking capacity), with an optional manufacturer part number.
3. **Price** (owned by the user): each line is priced from a selected price list. The tool shows where each price came from.

A line without a price stays visible and is marked **unpriced**. A price copied from a list is marked with its list and date. A price typed by hand is marked **manual**. Totals show how much of the total is unpriced, so a BoQ is never silently incomplete.

### How quantities come out of the model

| Item | Rule |
| --- | --- |
| Devices (breakers, disconnectors, transformers, and so on) | One count per device, grouped by class and key attributes |
| Cables | Routed length from the drawing, plus configurable allowances (slack per end, termination, spare), by cable type and cross-section |
| Busbars | Length and rating, from the panel layout when it exists |
| Enclosures, rails, accessories | From the panel layout; before a layout exists, the line shows as "not yet specified" |
| Terminals, labels, small parts | **Assembly rules**: data that says "each 3-pole breaker adds three terminals". The rules are editable and visible, not hidden in code |

The "unplaced" and "unspecified" counts double as a checklist of what is still missing.

### Where prices come from, in order of build

1. **User price list import (version 1).** CSV or spreadsheet with item code, class or description, unit, price, currency, date and source. The user maps columns once. Several lists can exist (for example Dekel-based, supplier A quote), and each line can pick one.
2. **Adjustments.** Percent discount or markup per list, per chapter or per line (the Dekel "minus 15 percent" pattern), VAT as a separate setting, currency per list.
3. **Chapter numbering template.** An optional template that numbers lines in the Israeli tender style (for example electrical chapter 08). Without a licensed list, the numbers are labels only.
4. **Catalog import (later).** ETIM xChange or BMEcat files from a supplier fill identity and attributes, and prices if the supplier provides them.
5. **Manufacturer connectors (later, optional).** One plug-in per manufacturer API, only after the terms allow it.
6. **Hosted catalog (SaaS edition, much later).** Shared, curated data. This is a content and legal business of its own, so do not plan on it until editions are decided.

### Outputs

* Spreadsheet (primary), PDF, and a printable BoQ in the user's language with right-to-left layout.
* Each line links back to the elements that produced it, so a click in the BoQ selects them in the diagram and the panel layout.
* A "show how this quantity was calculated" view, in line with the traceable-numbers rule for the engine.

### Risks

* **Liability.** A BoQ with wrong quantities costs money. The same rule applies as for the engine: every quantity is traceable, and golden-file tests lock the exported output.
* **Assembly rules grow without limit.** Keep them as data with an owner-reviewed default set.
* **Price lists are copyrighted.** Never bundle one. The user imports what they have the right to use.
* **Spreadsheet library.** Blue Grid uses an unmaintained `xlsx` release with known advisories. Choose a maintained exporter before building this.
* **Classification gaps.** ETIM may lack a class for a niche part (for example an airfield-lighting series transformer). Allow a custom class that maps to the nearest ETIM one.

## Questions for the owner

1. Do you or your users already hold a Dekel licence, or use Remador or a similar tool? If so, can it export to a spreadsheet?
2. For your projects, is the BoQ normally priced against Dekel, against supplier quotes, or both?
3. Which suppliers do you actually buy from in Israel? One of them may share a catalog file.
4. Should version 1 produce a BoQ in the Dekel chapter style, or a plain grouped list?
5. Do you want cable allowances (slack, terminations) to follow a fixed default set, or be set per project?
