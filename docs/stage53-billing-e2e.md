# Stage 53 — Billing E2E (non-charging)

## Scope

This stage validates the production billing lifecycle without creating a real paid subscription or charging a card.

Validated production evidence on 2026-09-18:
- live PRO price `price_1UGLdjKmvvWdDZmoz734i87Q`: active, BRL 29.90/month;
- live webhook endpoint: `https://importafacil-gamma.vercel.app/api/stripe/webhook`;
- endpoint enabled for checkout completion, subscription create/update/delete, invoice paid and payment failed;
- production currently has no Stripe subscriptions, so no financial mutation was performed;
- Supabase billing tables and webhook audit store are reachable;
- current stored profiles are FREE, consistent with the absence of live subscriptions.

## Lifecycle contract

- FREE user: authenticated checkout is allowed.
- Existing PRO: duplicate checkout is rejected.
- Checkout associates `user_id` metadata and reuses an existing Stripe customer when available.
- `active` and `trialing`: entitlement PRO.
- `past_due`, `unpaid`, `paused`, `canceled`, `incomplete` and other non-entitled states: entitlement FREE.
- Webhook signatures must be current and valid.
- Stripe event IDs are audited and processed idempotently.
- Customer Portal requires an authenticated user and a stored Stripe customer ID.
- Subscription status endpoint requires authentication and disables caching.

A true paid checkout remains a deliberate human financial action and is not executed automatically by this stage.
