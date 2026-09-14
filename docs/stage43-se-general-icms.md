# Stage 43 — Sergipe general ICMS scope

## Goal
Homologate Sergipe in the shared `GENERAL` state engine using only the general ICMS import rate.

## Rule
- UF: SE
- scope: `general_rate_only`
- general ICMS import rate: 19%
- effective from: 2023-04-01

## Legal basis
- Lei/SE 3.796/1996, art. 18, I, j, as amended by Lei 9.176/2023: 19% for remaining internal operations and services.
- Lei/SE 3.796/1996, art. 18, §2º: the internal rate also applies to imports from abroad.
- Lei/SE 9.176/2023, art. 2º, I: the 19% modal rate takes effect on 01/04/2023.

Official sources:
- https://aleselegis.al.se.leg.br/Arquivo/Documents/legislacao/HTML/l91762023.html
- https://aleselegis.al.se.leg.br/Arquivo/Documents/legislacao/html/l37961996.html

## Deliberately out of scope
Fundo Estadual de Combate e Erradicação da Pobreza/additionals, product-specific rates, benefits, reductions, exemptions, deferrals, anticipations, ST, special regimes and sector treatments remain outside this stage.

## Safety
- No new ICMS formula is introduced.
- SE reuses the shared import ICMS gross-up formula.
- Two-key activation is required through registry + `stage43-se-general-rate` approval.
- TO remains unsupported and fail closed.

## Regression
`scripts/test-se-general-icms-stage43.mjs` verifies rate, effective date, gross-up math, warning, activation and out-of-scope rejection.
