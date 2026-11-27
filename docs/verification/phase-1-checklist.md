# Phase 1 verification checklist

Everything below was written from the drafter's understanding of the standards. None of it is verified. The owner checks each line against the standard or a source they trust, then records the result in [signoff.md](./signoff.md). A table's `verified` flag in the code changes to `true` only after that.

## Formulas

| # | Item | Code | What to check |
| --- | --- | --- | --- |
| F1 | Voltage factor c: low voltage 1.05 (6 percent tolerance, Israel) or 1.10 (10 percent, IEC profile), min 0.95; medium voltage 1.10 / 1.00 | `catalog/src/standards/profiles.ts`, `engine/src/short-circuit.ts` `factors` | Values, and which tolerance Israeli low-voltage networks use |
| F2 | Network feeder: Z_Q = c U^2 / S''k, X_Q = Z_Q / sqrt(1 + (R/X)^2), R/X = 0.1 | `catalog/src/components/definitions.ts` (grid) | Formula, the 0.1, and that c of the feeder's own voltage level is used |
| F3 | Transformer: Z = uk U^2 / Sr, R = ur, X = sqrt(uk^2 - ur^2), K_T = 0.95 c_max / (1 + 0.6 x_T), c_max of the low-voltage side, used for max and min currents | definitions.ts (transformer), `short-circuit.ts` `scTransformers` | Formula; whether K_T applies to minimum currents |
| F4 | Generator: Z = xd'' U^2 / Sr, K_G = (Un/Ur) c_max / (1 + xd'' sin(phi)), R = 0.15 X for U <= 1 kV, else 0.07 X | definitions.ts (generator) | Formula and the R/X assumption |
| F5 | I''k3 = c Un / (sqrt3 \|Zk\|); I''k2 = (sqrt3 / 2) I''k3 | `short-circuit.ts` | Formula; Z1 = Z2 assumption |
| F6 | kappa = 1.02 + 0.98 exp(-3 R/X), ip = kappa sqrt2 I''k3 | `short-circuit.ts` | Formula; the method (R/X at the fault point) |
| F7 | Ith = I''k sqrt(m + n), n = 1, m = (exp(4 f Tk ln(kappa-1)) - 1) / (2 f Tk ln(kappa-1)), f = 50 Hz, Tk = 1 s | `short-circuit.ts` | Formula and the two assumed values |
| F8 | Cable resistance R = rho L / S (1 + alpha (theta - 20)): 20 degrees C for max fault, 80 for min fault, 70 (PVC) or 90 (XLPE) for load flow; reactance 0.08 mOhm per m | `catalog/src/standards/conductors.ts`, `engine/src/cables.ts` | rho, alpha, the temperatures, the reactance (an assumption until a cable catalog exists) |
| F9 | Loop impedance: one conductor for three-phase, out and back for single-phase and DC | `engine/src/cables.ts` | Model |
| F10 | Cable check: Ib <= In <= Iz, k2 In <= 1.45 Iz, S >= I sqrt(t) / k; k2 1.45 for a breaker and 1.6 for a fuse; t default 0.1 s | `engine/src/checks.ts`, definitions.ts | Rules and defaults |
| F11 | Voltage drop (1 - V_pu) * 100 against the profile limit: 5 percent (il), 4 percent (iec) | `profiles.ts`, `engine/src/flow-results.ts` | Limits and their source; the owner named none yet |
| F12 | Ampacity: temperature and grouping factors taken as 1 | `engine/src/checks.ts` | Acceptable for Phase 1? |

## Tables

| # | Table | Code | What to check |
| --- | --- | --- | --- |
| T1 | Ampacity, reference method C, copper, PVC and XLPE, two and three loaded conductors, 1.5 to 240 mm2 | `catalog/src/standards/ampacity.ts` | Every value. Entered from memory; aluminium and other methods are missing and reported as "no table" |
| T2 | Resistivity (Cu 0.017241, Al 0.028264 ohm mm2 per m), temperature coefficients (0.00393, 0.00403) | conductors.ts | Values |
| T3 | k values (Cu PVC 115, Cu XLPE 143, Al PVC 76, Al XLPE 94) | conductors.ts | Values |
| T4 | Maximum operating temperature (PVC 70, XLPE 90) | conductors.ts | Values |

## Reference cases

All 20 cases in `packages/engine/tests/reference/` are drafts: `signedOffBy` is empty. Each carries its hand calculation in `source`. Check the expected value by your own calculation, then fill `signedOffBy` and `signedOffOn`.
