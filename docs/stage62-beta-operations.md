# Stage 62 — Controlled beta operations

Stage 62 prepares the controlled beta for real user feedback without claiming that external users have already tested the product.

## Feedback channel

Authenticated users can submit structured feedback through `/feedback` and `POST /api/beta-feedback`.

Supported categories:
- bug;
- calculation question;
- UX;
- feature request;
- other.

Feedback messages are stored in Supabase and remain user-scoped through RLS. Users can view only their own recent feedback.

## Privacy

The feedback message itself, user ID and account email are never sent to operational telemetry. Telemetry records only:
- event `beta.feedback`;
- success/rejected/failed outcome;
- safe category token when applicable;
- non-sensitive reason code;
- execution duration and deployment SHA.

The API validates category, message length and optional page path before persistence.

## Database controls

Production evidence for this stage:
- `public.beta_feedback` exists;
- RLS is enabled;
- authenticated users may select only their own rows;
- authenticated users may insert only rows whose `user_id = auth.uid()`;
- anonymous access is revoked;
- an index supports user/date history access.

The Supabase security advisor continues to report only the previously documented Leaked Password Protection warning. This stage does not upgrade a paid platform plan automatically.

## Beta operating rule

This infrastructure makes feedback collection operationally ready. It does **not** assert that a target number of external users has participated, that conversion targets have been achieved, or that unrestricted commercial release is authorized.

No fiscal rule, billing price, entitlement logic or release scope is changed.
