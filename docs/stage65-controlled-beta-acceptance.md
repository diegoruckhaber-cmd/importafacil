# Stage 65 — Controlled beta acceptance

Stage 65 closes the current development cycle as a controlled-beta acceptance gate.

## Technical acceptance

The gate is green only when:
- the release candidate remains technically ready;
- all 27 UFs remain active;
- there are no P0 blockers;
- controlled beta remains released with restrictions;
- unrestricted commercial release remains a separate manual decision.

The operational contract is exposed at `GET /api/controlled-beta-readiness`.

## Customer-facing acceptance

Production validation on 2026-09-20 confirmed:
- the landing page presents the restored commercial/SaaS experience;
- the public simulator uses customer-facing language and hides specialist tax fields under advanced options;
- legacy internal labels such as "Simulation V2" and "Escopo estadual" are not shown as primary customer copy;
- `/api/health` returns 27 active UFs with safe activation;
- `/api/billing-readiness` is green;
- authenticated beta feedback remains user-scoped and supports user deletion.

## Boundary

This stage does not authorize unrestricted commercial launch. It certifies the product for continued controlled-beta use and testing only. No tax formula, state rate, billing price, entitlement rule, or release scope is changed.
