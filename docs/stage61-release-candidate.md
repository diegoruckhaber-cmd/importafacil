# Stage 61 — Release Candidate

Stage 61 freezes feature expansion and turns the current product into a release candidate for controlled-beta operation.

## Candidate

`RC-2026-09-18`

The candidate is technically valid only when all of the following remain true:

- the launch-readiness matrix is fully verified;
- there are no P0 blockers;
- state activation is safe;
- all 27 Brazilian UFs are explicitly active;
- controlled beta remains `released_with_restrictions`;
- unrestricted commercial release remains only `eligible_for_release_review`.

The release-candidate contract is exposed by `GET /api/release-candidate`.

## Live validation required before closure

After merge, Stage 61 is closed only after the production deployment for the merge commit is READY and the following production checks pass:

- `/api/health`;
- `/api/billing-readiness`;
- `/api/launch-readiness`;
- `/api/release-scope`;
- `/api/release-candidate`;
- canonical public landing page;
- Simulation V2 route.

The complete CI gate continues to run dependency audit, all fiscal/product regressions and the production build.

## Database/security evidence

The production Supabase audit performed for the candidate confirms RLS enabled on all current public tables. The only security-advisor warning observed is Leaked Password Protection disabled; this is the already documented platform-level residual from Stage 52. No paid Supabase plan change is made automatically.

Performance advisor informational findings about currently-unused indexes are not treated as removal instructions because low usage is expected in the controlled beta and the indexes support intended access patterns.

## Release boundary

This candidate does **not** authorize unrestricted commercial release. Commercial promotion remains a separate explicit manual decision. No fiscal formula, rate, state scope, billing price or entitlement rule changes in this stage.
