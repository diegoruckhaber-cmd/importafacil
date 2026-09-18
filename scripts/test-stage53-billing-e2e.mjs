import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import {
  planForStripeSubscriptionStatus,
  verifyStripeWebhookSignature,
} from "../lib/stripe-webhook.ts";

for (const status of ["active", "trialing"]) {
  assert.equal(planForStripeSubscriptionStatus(status), "PRO", status + " must entitle PRO");
}
for (const status of ["incomplete", "incomplete_expired", "past_due", "unpaid", "paused", "canceled", null, undefined]) {
  assert.equal(planForStripeSubscriptionStatus(status), "FREE", String(status) + " must fail closed to FREE");
}

const payload = JSON.stringify({ id: "evt_stage53", type: "customer.subscription.updated" });
const secret = "whsec_stage53_regression";
const now = 1789740300;
const signature = crypto.createHmac("sha256", secret).update(now + "." + payload).digest("hex");
assert.equal(verifyStripeWebhookSignature(payload, "t=" + now + ",v1=" + signature, secret, now), true);
assert.equal(verifyStripeWebhookSignature(payload, "t=" + now + ",v1=00" + signature.slice(2), secret, now), false);
assert.equal(verifyStripeWebhookSignature(payload, "t=" + (now - 301) + ",v1=" + signature, secret, now), false);

const checkout = fs.readFileSync("app/api/checkout/route.ts", "utf8");
assert.match(checkout, /Sessão autenticada é obrigatória/);
assert.match(checkout, /Seu plano PRO já está ativo/);
assert.match(checkout, /stripe_customer_id/);
assert.match(checkout, /subscription_data\[metadata\]\[user_id\]/);
assert.match(checkout, /client_reference_id/);

const webhook = fs.readFileSync("app/api/stripe/webhook/route.ts", "utf8");
for (const event of [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]) assert.ok(webhook.includes(event), "webhook must handle " + event);
assert.match(webhook, /verifyStripeWebhookSignature/);
assert.match(webhook, /registerDelivery/);
assert.match(webhook, /duplicate: true/);
assert.match(webhook, /markDelivery\(eventId, "failed"\)/);

const portal = fs.readFileSync("app/api/billing-portal/route.ts", "utf8");
assert.match(portal, /auth\.getUser/);
assert.match(portal, /stripe_customer_id/);
assert.match(portal, /createStripePortalSession/);

const subscription = fs.readFileSync("app/api/subscription/route.ts", "utf8");
assert.match(subscription, /Sessão autenticada é obrigatória/);
assert.match(subscription, /Cache-Control/);
assert.match(subscription, /no-store/);

const readiness = fs.readFileSync("app/api/billing-readiness/route.ts", "utf8");
assert.match(readiness, /checkStripeWebhookEndpoint/);
assert.match(readiness, /live_lifecycle_endpoint_enabled/);
assert.match(readiness, /importafacil-gamma\.vercel\.app\/api\/stripe\/webhook/);

const auditMigration = fs.readFileSync("supabase/migrations/20260918_add_stripe_webhook_delivery_audit.sql", "utf8");
assert.match(auditMigration, /event_id text primary key/);

console.log("Stage 53 billing E2E non-charging regression passed.");
