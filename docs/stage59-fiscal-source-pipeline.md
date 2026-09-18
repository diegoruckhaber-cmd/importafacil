# Stage 59 — Fiscal source monitoring pipeline

This stage hardens source monitoring without changing any fiscal rule.

## Federal sources
- a scheduled weekly workflow regenerates a review-only candidate from the official MDIC tariff workbook and the official RFB TIPI workbook;
- candidate semantics are compared against the published federal snapshot;
- any detected change is evidence for human review, never an automatic publication;
- the workflow is read-only and cannot push to the repository.

## Defense commercial
- the existing daily MDIC defense-commercial audit remains read-only and produces a candidate artifact for review;
- publication still requires a reviewed pull request under the legislative update runbook.

## Historical Stage 2 workflow
The original Stage 2 federal workflow is retained only as a manual reproducer. Its former write permission and automatic push behavior are removed. It can regenerate evidence but cannot publish.

## Publication contract
Automatic collection is not automatic publication. Any change to rate, validity, scope, EX, quota, benefit, suspension, or defense-commercial measure must pass:
1. official-source review;
2. dedicated regression;
3. complete CI;
4. reviewed pull request;
5. production smoke after merge.

No tax rate, formula, state activation, or defense-commercial catalog entry is changed by this stage.
