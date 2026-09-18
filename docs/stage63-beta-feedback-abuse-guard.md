# Stage 63 — Beta feedback abuse guard

Stage 63 adds a server-side abuse guard to the authenticated beta feedback channel.

## Limit

Each authenticated user may persist at most 10 feedback records in a rolling one-hour window.

Before every insert, the API counts only the caller's own recent rows through the same RLS-scoped Supabase client. If the quota cannot be checked, the write fails closed with HTTP 503. If the quota is reached, the API returns HTTP 429 and a `Retry-After: 3600` header.

## Privacy and security

The quota check never requires an elevated Supabase key and never reads another user's feedback. Telemetry records only the safe category token and reason code; feedback message, user ID and email remain excluded.

This stage changes neither tax logic nor release scope.
