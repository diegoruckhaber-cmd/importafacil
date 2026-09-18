import assert from "node:assert/strict";
import fs from "node:fs";
import {
  planForStripeSubscriptionStatus,
  stripeCustomerIdFromObject,
} from "../lib/stripe-webhook.ts";

assert.equal(stripeCustomerIdFromObject({ customer: "cus_live_123" }), "cus_live_123");
assert.equal(stripeCustomerIdFromObject({ customer: { id: "cus_live_456" } }), "cus_live_456");
assert.equal(stripeCustomerIdFromObject({}), null);

assert.equal(planForStripeSubscriptionStatus("active"), "PRO");
assert.equal(planForStripeSubscriptionStatus("trialing"), "PRO");
assert.equal(planForStripeSubscriptionStatus("canceled"), "FREE");
assert.equal(planForStripeSubscriptionStatus("past_due"), "FREE");

const webhook = fs.readFileSync("app/api/stripe/webhook/route.ts", "utf8");
for (const field of [
  "stripe_customer_id",
  "stripe_subscription_id",
  "subscription_status",
  "current_period_end",
]) {
  assert.match(webhook, new RegExp(field), "webhook must synchronize " + field);
}

const checkout = fs.readFileSync("app/api/checkout/route.ts", "utf8");
assert.match(checkout, /select\("plan,stripe_customer_id"\)/);
assert.match(checkout, /Seu plano PRO já está ativo/);
assert.match(checkout, /params\.set\("customer", existingCustomerId\)/);
assert.match(checkout, /params\.set\("customer_email", email\)/);

const upgrade = fs.readFileSync("app/upgrade/page.tsx", "utf8");
assert.match(upgrade, /\/api\/subscription/);
assert.match(upgrade, /Seu PRO está ativo/);

const dashboard = fs.readFileSync("app/dashboard/page.tsx", "utf8");
assert.match(dashboard, /\/api\/subscription/);
assert.match(dashboard, /Minha assinatura/);

console.log("Stage 48 subscription lifecycle regression passed.");
