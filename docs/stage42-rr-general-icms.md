# Stage 42 — Roraima general ICMS scope

## Goal
Homologate Roraima in the shared `GENERAL` state engine using only the general ICMS import rate.

## Rule
- UF: RR
- scope: `general_rate_only`
- general ICMS import rate: 20%
- effective from: 2023-03-30

## Legal basis
- RICMS/RR (Decreto 4.335-E/2001), art. 46, I, d: 20% for the remaining goods, as updated by Decreto 37.319-E/2025.
- RICMS/RR, art. 46, § 1º, II: internal rates apply to the entry of goods imported from abroad.
- Decreto 37.319-E/2025, art. 4º, IV: effects for the modal-rate change from 30/03/2023.

Official consolidated RICMS source used:
- https://www.sefaz.rr.gov.br/downloads?catid=494&id=25462&m=0&task=download.send

## Deliberately out of scope
Postal or express imports, benefits, reductions, exemptions, deferrals, anticipations, ST, special regimes, product-specific rates and sector treatments are not inferred or calculated in this stage.

## Safety
- No new ICMS formula is introduced.
- RR reuses the shared import ICMS gross-up formula.
- Two-key activation is required via registry + `stage42-rr-general-rate` approval.
- SE and TO remain unsupported and fail closed.

## Regression
`scripts/test-rr-general-icms-stage42.mjs` verifies the 20% rule, gross-up math, warning, two-key activation and out-of-scope rejection.
