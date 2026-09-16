import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { getLaunchReadiness } from "../lib/launch-readiness.ts";
import { getReleaseScope } from "../lib/release-scope.ts";
import { planForStripeSubscriptionStatus, verifyStripeWebhookSignature } from "../lib/stripe-webhook.ts";

const payload = JSON.stringify({ id: "evt_stage47", type: "customer.subscription.updated" });
const secret = "whsec_stage47_regression";
const timestamp = 1_800_000_000;
const digest = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
assert.equal(verifyStripeWebhookSignature(payload, `t=${timestamp},v1=${digest}`, secret, timestamp), true);
assert.equal(verifyStripeWebhookSignature(payload, `t=${timestamp},v1=${"0".repeat(64)}`, secret, timestamp), false);
assert.equal(verifyStripeWebhookSignature(payload, `t=${timestamp - 301},v1=${digest}`, secret, timestamp), false);
assert.equal(planForStripeSubscriptionStatus("active"), "PRO");
assert.equal(planForStripeSubscriptionStatus("trialing"), "PRO");
for (const status of ["incomplete", "past_due", "unpaid", "paused", "canceled", undefined]) assert.equal(planForStripeSubscriptionStatus(status), "FREE");

const checkout = fs.readFileSync("app/api/checkout/route.ts", "utf8");
assert.match(checkout, /process\.env\.STRIPE_PRO_PRICE_ID/);
assert.doesNotMatch(checkout, /price_1U2fwM3Fg8OaACj8YADPcwaQ/);
assert.match(checkout, /Checkout ainda não configurado/);

const webhook = fs.readFileSync("app/api/stripe/webhook/route.ts", "utf8");
for (const event of ["checkout.session.completed", "customer.subscription.updated", "customer.subscription.deleted", "invoice.paid", "invoice.payment_failed"]) assert.match(webhook, new RegExp(event.replaceAll(".", "\\.")));
assert.match(webhook, /SUPABASE_SERVICE_ROLE_KEY/);
assert.match(webhook, /STRIPE_WEBHOOK_SECRET/);
assert.match(webhook, /assertRestOk/);

const readiness = getLaunchReadiness();
const releaseScope = getReleaseScope();
assert.equal(readiness.release.controlledBeta, releaseScope.controlledBeta.status);
assert.equal(readiness.release.unrestrictedCommercial, releaseScope.unrestrictedCommercial.status);
assert.equal(readiness.release.controlledBeta, "released_with_restrictions");
assert.equal(readiness.release.unrestrictedCommercial, "eligible_for_release_review");

console.log("Stage 47 commercial hardening: OK — Stripe fail-closed guards, webhook lifecycle, and release semantics validated");
