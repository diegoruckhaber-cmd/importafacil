import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260918_add_stripe_webhook_delivery_audit.sql", "utf8");
assert.match(migration, /create table if not exists public\.stripe_webhook_events/);
assert.match(migration, /enable row level security/);
assert.match(migration, /revoke all on table public\.stripe_webhook_events from public, anon, authenticated/);
assert.match(migration, /grant select, insert, update, delete on table public\.stripe_webhook_events to service_role/);

const webhook = fs.readFileSync("app/api/stripe/webhook/route.ts", "utf8");
assert.match(webhook, /registerDelivery/);
assert.match(webhook, /markDelivery/);
assert.match(webhook, /registeredStatus === "processed" \|\| registeredStatus === "ignored"/);
assert.match(webhook, /duplicate: true/);
assert.match(webhook, /last_error: status === "failed" \? "processing_failed" : null/);
assert.doesNotMatch(webhook, /body: JSON\.stringify\(event/);

const readiness = fs.readFileSync("app/api/billing-readiness/route.ts", "utf8");
assert.match(readiness, /stripe_webhook_events/);
assert.match(readiness, /webhookEvents/);

console.log("Stage 50 webhook delivery audit regression passed.");
