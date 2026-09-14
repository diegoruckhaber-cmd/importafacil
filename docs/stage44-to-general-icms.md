# Stage 44 — Tocantins general ICMS scope

## Goal
Homologate Tocantins as the final Brazilian UF in the shared `GENERAL` state engine, using only the general ICMS import rate.

## Rule
- UF: TO
- scope: `general_rate_only`
- general ICMS import rate: 20%
- effective from: 2023-04-01

## Legal basis
- Lei/TO 1.287/2001 (Código Tributário do Estado), art. 27, II, with wording from Lei 4.141/2023: 20% for internal operations and services.
- Lei/TO 1.287/2001, art. 27, § 1º, I: the internal rate also applies to the entry of goods imported from abroad.
- Lei/TO 4.141/2023, art. 2º: the modal-rate change takes effect on 01/04/2023.

Official sources used:
- https://www.al.to.leg.br/arquivo/68306
- https://al.to.leg.br/arquivo/62676

## Deliberately out of scope
FECOEP-TO/additionals when applicable, benefits, base reductions, exemptions, deferrals, anticipations, substitution tax, special regimes, product-specific rates and sector-specific treatments are not inferred or calculated in this stage.

## Safety
- No new ICMS formula is introduced.
- TO reuses the shared import ICMS gross-up formula.
- Activation requires both the jurisdiction registry and reviewed approval `stage44-to-general-rate`.
- With TO active, all 27 Brazilian UFs have an explicit homologated state scope; unknown/non-Brazilian UF codes remain fail-closed.
- National coverage changes unrestricted commercial status only to `eligible_for_release_review`; it does not auto-release an unrestricted product.

## Readiness
Stage 44 closes the progressive state-expansion item at 27/27 UFs. This milestone does not widen `general_rate_only`: benefits, reductions, exemptions, ST, special regimes and specific rates still require separate homologation.

## Regression
`scripts/test-to-general-icms-stage44.mjs` verifies the 20% rule, effective date, shared gross-up math, warning, two-key activation, 27/27 coverage, release-review gating and rejection of out-of-scope regimes.
