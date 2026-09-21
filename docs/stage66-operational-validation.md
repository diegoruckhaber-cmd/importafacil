# Stage 66 — Operational validation, 2026-09-21

## Acceptance status

- Point 1, production onboarding: passed.
- Point 2, source audits: federal audit repaired and locally executed end to end; MDIC candidate remains blocked pending source interpretation. Do not call the combined audit gate green.
- Point 3, evidence consolidation: recorded here. Controlled beta remains released with restrictions; unrestricted commercial release is not authorized by this work.

## Production evidence

Production URL: https://importafacil-gamma.vercel.app
Deployment: dpl_Ep8W9LRq2ub59U9oNqij5qb8Zan9, READY, production.
Commit: b5a50aeca1aedcc97673fba25a55ec4a0be15b3e (Stage 66 / PR #115).

Live `/api/health` returned `ok=true`, 27 active UFs, `stateActivationStatus=safe`, and the same deployment SHA.
Live `/api/controlled-beta-readiness` returned `ready_for_controlled_beta`, all five checks true, `released_with_restrictions`, and `manualCommercialAuthorizationRequired=true`.

The production browser displayed the Stage 66 guide and contextual field help. A synthetic scenario was entered and calculated for SC and SP: NCM 39169090, China, 1,000 units, USD 10/unit, 500 kg, FX 5.5, freight USD 1,200, insurance USD 100, storage BRL 3,500, maritime, DI, resale. No customer data, history save or payment was submitted.

- SC: calculation completed with warnings, nationalized cost BRL 105,699.08.
- SP: calculation completed with warnings, nationalized cost BRL 106,945.41; general-rate-only scope warning remained visible.
- These are functional smoke results, not an independent tax opinion or an authenticated account/billing end-to-end test.
- Browser console entries inspected were extension-origin metadata errors, not application-origin exceptions.
- Screenshot: [SP result](evidence/stage66/production-simulator-sp.jpg).

## Federal audit

Root cause: an upload-artifact block was duplicated inside a shell command, making the YAML invalid. Removed the duplicate and repaired the shell quoting.

Executed the repaired workflow's download, inspection, ingestion, comparison and publication-guard commands locally against the official MDIC/RFB workbooks. Candidate and published snapshots contain 32,514 records and are byte-identical:
`a93a6645e5384feaf01f2a898284e5584c7a31acc3919b7a46b1704b1747b43e`.
See [comparison output](evidence/stage66/federal-audit-summary.txt).
This proves local execution; a future scheduled/manual GitHub run is a separate execution record.

## MDIC audit

The original live collection returned 96 linked pages, 87 measures, no fetch errors, and 9 measures with at least one origin missing parsed rights. See [original diagnostic](evidence/stage66/mdic-before.json).

Repaired evidence-backed formatting cases: inline HTML splitting rates/exporters, punctuation/bullets in origin headings, written `Quilograma`, and parenthetical `em US$/milheiro` units. Added six regression cases, including refusal to guess absent units and ambiguous origins.

The candidate now has a separate output path; collection failures fail the command; pipeline failure propagation is explicit. Candidate and collection evidence upload runs even when validation fails. The strict completeness assertions remain in place. No generated catalog or fiscal rule is published by this change.

Remaining cases found in the nine-page replay:

| Official page | Blocker |
|---|---|
| pneus-agricolas | Amounts do not state their unit in the page's applied-right section; do not infer USD/t. |
| vidros-automotivos | Unlabelled exporter paragraphs coexist with Malaysia-specific and importer-specific tables; do not assign origins by proximity. |
| laminados-planos-de-baixo-carbono-e-baixa-liga-chapas-grossas | South Africa is in the heading, but the page also describes termination without renewal; needs act-specific scope review. |
| pneus-de-automoveis | Asterisked Taipei rights refer to immediate suspension; preserve suspension semantics before accepting the row. |

A subsequent fresh full crawl yielded 88 parsed measures, five measures with unresolved origins (the four above plus Germany for `tubos-de-coleta-de-sangue`), and one official-source HTTP 502 at `laminados-planos-de-aco-ao-silicio-aco-gno`. The command correctly failed closed on that fetch failure. See [fresh full-crawl diagnostic](evidence/stage66/mdic-after.json). This candidate is not accepted.

All page URLs are recorded in the diagnostics. The next work is a source-backed parser/scope review of these cases, followed by a full fresh candidate audit and candidate resolver regressions. Do not weaken assertions, substitute zero rights, or publish the candidate just to make CI green.

## Verification

- Published-catalog regression battery: 138/138 scripts passed.
- Next.js production build: passed.
- All workflow YAML and embedded shell commands: parsed/syntax checked.
- Six parser regressions: passed.
- Existing fiscal snapshots and published MDIC catalog: unchanged.

An initial exploratory regression run overlapped generation of a temporary candidate in the legacy output path and failed two catalog tests. The candidate was removed from the working tree and the entire suite was rerun against the published catalog: 138/138 passed. The workflow's new explicit output path prevents that mixing in future collection runs.
