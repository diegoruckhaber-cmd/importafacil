# Stage 57 — Operational observability

Stage 57 extends the privacy-safe simulation telemetry from Stage 11 to the commercial runtime.

Structured server events now cover checkout success/rejection/failures, Stripe Customer Portal sessions, Stripe webhook success/duplicate/ignored/failures, while the existing Simulation V2 status/version telemetry remains the fiscal-runtime signal.

The operational event contract stores only event name and outcome, duration, allow-listed reason code, non-sensitive mode/event type and deployment SHA. It must not include e-mail, user ID, Stripe identifiers, NCM, exporter, item description, monetary values, access tokens or raw exception messages.

The health endpoint exposes the observability contract version so runtime logs can be correlated with a deploy without exposing business data.

Operational alerts should be built from Vercel structured runtime logs and the existing Stripe webhook audit table. This stage does not create a second analytics database and does not alter fiscal calculations.
