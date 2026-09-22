# Stage 67 — operational integrity (2026-09-22)

## Acceptance and remaining external evidence

1. **MDIC: pending.** Origin state can no longer leak between tables and unlabelled paragraphs. Structured tables are not reparsed as paragraph values. Multi-row unit headers retain Lisina and glove coverage. Restricted-content HTTP 200 is a collection failure. Missing origin rights now fail the collector itself, not just the following workflow assertion. No candidate or fiscal rate is published.
2. **Saved results:** save API invokes the official engine and legal-trace service used by calculation; client `result` is ignored. Service-only database function records execution ID, timestamp, deployment SHA and input/result hashes. Profile row lock serializes saves and enforces FREE limit atomically. Historical rows are not recalculated or labelled server-verified. Apply additive migration first, then deploy, then revoke remaining legacy client writes with the second migration.
3. **Readiness:** endpoints check latest main-branch MDIC/federal audit runs, enforce 48h/192h maximum evidence age, detect source workbook date changes, and fail closed on unavailable evidence. Pending MDIC legal reconciliation remains a separate blocker even if collection passes. Static engine coverage remains separate from operational authorization. Health remains a liveness endpoint.
4. **Billing: pending real E2E.** Production database read on 2026-09-22 found no subscription rows and no webhook-event rows. This is evidence of absence in these application tables, not a claim about all Stripe transactions. A working configuration or checkout return URL is not proof of payment. Dashboard wording now reflects this distinction.
5. **UX:** saved result/report/comparator use Portuguese status labels; historical records disclose missing execution provenance. History/comparator can load beyond 100 rows. Dashboard filtering/metrics explicitly cover loaded rows. Report without an ID fetches the latest comparable result, instead of searching only 20 arbitrary rows. Full visual/authenticated acceptance remains to be recorded.
6. **Pilot: prepared, not conducted.** Use the protocol below; no external participants have been contacted and no measurements are invented.

## MDIC source reconciliation register

Official page base: https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/

| Page slug | Finding from current MDIC page | Required closure evidence |
| --- | --- | --- |
| tubos-de-coleta-de-sangue | Germany remains in heading; Circular SECEX 29/2021 describes termination without renewal. Current rights list China, USA and UK, with sunset review continuation note. | Reconcile origin termination, continuing validity and historical suspension with controlling acts. |
| pneus-de-automoveis | Taipei asterisk refers to immediate suspension; Thailand is separate. | Preserve origin-specific suspension when parsing marked rates; verify Res. 831/2025. |
| pneus-agricolas | Amounts lack units in the applied-right section. | Check Res. 452/2023 and 474/2023; never assume USD/t. |
| vidros-automotivos | Chinese-looking paragraphs are unlabelled; importer percentages coexist with Malaysia table. | Act-backed origin/product/importer scope, including Res. 450/2023, 556/2024, 832/2025 and 888/2026. |
| laminados-planos-de-baixo-carbono-e-baixa-liga-chapas-grossas | South Africa termination described; Ukraine has suspension footnote. | Reconcile Circular 76/2025 and Res. 789/2025 without suspending China/Korea. |
| laminados-planos-de-aco-ao-silicio-aco-gno | Redirects to restricted-content page despite HTTP 200. | Official confirmation of replacement/duplicate relationship with aco-gno, not a guessed URL substitution. |

Linked Diário Oficial pages returned HTTP 502 in this environment; a second retrieval method also failed on sampled acts. Current MDIC summaries are preserved as leads, not used to fabricate missing legal conditions. Re-run full collection and strict candidate resolver validation after act reconciliation.

## Subscription acceptance protocol

Use a consenting account and start with FREE access. User performs actual payment via `/upgrade`; no payment is submitted by this work.

Record privately: checkout session ID, subscription ID, invoice ID, paid amount/currency, Stripe livemode, event ID and provider timestamp. Do not commit customer identity or card data.

1. Confirm invoice payment with Stripe, not the redirect query parameter.
2. Confirm signed webhook audit reaches `processed`, exactly once under replay.
3. Confirm the same account's `/api/subscription` returns PRO and newly available report/comparison/save access works after refresh and fresh login.
4. Exercise cancellation at period end, renewal/failure and revoked access in Stripe test mode. Do not simulate a failure by charging real cards or mutating live subscription rows directly.
5. Observe terminal cancellation and FREE access after the actual billing policy date; check unrelated accounts are unaffected.

Close only with provider and application evidence from the same subscription. Current status: no payment/access evidence available.

## Accompanied pilot protocol

Recruit 5 consenting import professionals after operational blockers are reconciled. Sessions: 30–45 minutes, pseudonymous IDs P01–P05, one representative operation and one ambiguous/blocked case. Use synthetic or consented/sanitized commercial inputs.

Start timer when the participant sees the simulator; stop at first completed result. Record assisted versus unassisted time and abandonment. Before explaining an alert, ask the participant what it means. Reconcile output against an independent calculation with same date, NCM, origin, exporter, scope, quantity and costs.

For each session record: scenario ID, first-result seconds, assistance count, questions by screen, divergence by tax/cost in BRL and percentage, root cause, understood/unclear warnings, and willingness to pay at the actual displayed price (yes/no/uncertain plus reason). Report denominators; do not turn stated willingness into conversion.

Release criteria proposed for review: no unresolved material tax/defense divergence; at least 4/5 participants complete first scenario; every blocker understood or converted into a UX fix; compare completion time distribution and assistance rate before setting a commercial target. A 5-person pilot is directional, not statistically representative.

## Verification before review

- Complete published-catalog regression suite: 140/140 scripts passed.
- Parser regressions: 10 passed; workflow YAML and shell syntax checks passed.
- TypeScript and production build passed.
- Fresh collection: 96 source pages, 88 measures, 5 unresolved measures and 1 restricted source; command correctly failed. See `evidence/stage67/mdic-audit.json`.
- Published `data/` catalogs and fiscal engine rules are unchanged.
- Database additive migration applied; final client-write revocation is a post-deployment gate.
