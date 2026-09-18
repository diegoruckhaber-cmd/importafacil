import assert from "node:assert/strict";
import fs from "node:fs";

const helper = fs.readFileSync("lib/stripe-billing-portal.ts", "utf8");
assert.match(helper, /billing_portal\/configurations\?active=true/);
assert.match(helper, /features\[payment_method_update\]\[enabled\]/);
assert.match(helper, /features\[invoice_history\]\[enabled\]/);
assert.match(helper, /features\[subscription_cancel\]\[enabled\]/);
assert.match(helper, /features\[subscription_cancel\]\[mode\]/);
assert.match(helper, /billing_portal\/sessions/);

const route = fs.readFileSync("app/api/billing-portal/route.ts", "utf8");
assert.match(route, /auth\.getUser/);
assert.match(route, /stripe_customer_id/);
assert.match(route, /createStripePortalSession/);
assert.match(route, /\/upgrade\?portal=returned/);

const upgrade = fs.readFileSync("app/upgrade/page.tsx", "utf8");
assert.match(upgrade, /\/api\/billing-portal/);
assert.match(upgrade, /Gerenciar assinatura e cobrança/);
assert.match(upgrade, /consultar faturas/);

console.log("Stage 51 customer portal regression passed.");
