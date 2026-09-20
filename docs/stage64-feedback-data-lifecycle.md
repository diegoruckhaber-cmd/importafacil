# Stage 64 — Feedback data lifecycle

Stage 64 gives beta users direct control over the feedback records stored for their account.

## User deletion

Authenticated users can delete only their own feedback records. The control exists at two layers:

- Supabase RLS policy `beta_feedback_delete_own`;
- the API additionally filters deletion by both `id` and authenticated `user_id`.

Anonymous access remains revoked. There is no user-facing update policy, so submitted feedback can either remain as originally sent or be removed.

## API behavior

`DELETE /api/beta-feedback` requires:
- a valid authenticated session;
- a syntactically valid UUID;
- ownership of the requested feedback row.

A missing/non-owned row returns 404 without disclosing another user's content. Successful deletion emits only privacy-safe operational telemetry with mode `delete`.

## Production evidence

The Stage 64 migration was applied to the production Supabase project. Live inspection confirmed:
- RLS remains enabled on `public.beta_feedback`;
- select, insert and delete policies are scoped to `authenticated`;
- delete policy uses `auth.uid() = user_id`.

No fiscal rule, billing logic or release scope changes in this stage.


## Preview gate

The branch remains merge-gated on a fresh READY preview. If the deployment provider temporarily refuses a build because of an account-level rate limit, the preview is reissued after the external window clears; the merge is not performed against a failed/missing preview.
