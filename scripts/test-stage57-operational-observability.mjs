import assert from "node:assert/strict";
import fs from "node:fs";
import { buildOperationalEvent, OPERATIONAL_OBSERVABILITY_CONTRACT } from "../lib/operational-observability.ts";

assert.equal(OPERATIONAL_OBSERVABILITY_CONTRACT,"importafacil-operational-observability-v1");
const event=buildOperationalEvent({
  event:"billing.checkout",
  outcome:"failed",
  reasonCode:"stripe_checkout_create",
  mode:"v2",
  startedAtMs:Date.now()-12,
});
assert.equal(event.event,"billing.checkout");
assert.equal(event.outcome,"failed");
assert.equal(event.reasonCode,"stripe_checkout_create");
assert(event.durationMs>=0);

const rejected=buildOperationalEvent({
  event:"billing.portal",
  outcome:"rejected",
  reasonCode:"user@example.com",
  startedAtMs:Date.now(),
});
assert.equal(rejected.reasonCode,undefined,"free-form personal data must not enter the reason code");

const helper=fs.readFileSync("lib/operational-observability.ts","utf8");
const checkout=fs.readFileSync("app/api/checkout/route.ts","utf8");
const portal=fs.readFileSync("app/api/billing-portal/route.ts","utf8");
const webhook=fs.readFileSync("app/api/stripe/webhook/route.ts","utf8");
const simulation=fs.readFileSync("app/api/simulation-v2/route.ts","utf8");
const health=fs.readFileSync("app/api/health/route.ts","utf8");

assert.match(checkout,/billing\.checkout/);
assert.match(portal,/billing\.portal/);
assert.match(webhook,/billing\.webhook/);
assert.match(webhook,/emit\("duplicate"\)/);
assert.match(simulation,/emitSimulationV2Telemetry/);
assert.match(health,/importafacil-operational-observability-v1/);

for(const forbidden of ["email","userId","customerId","subscriptionId","eventId","ncm","exporter","fob","landedCost","accessToken"]){
  assert(!helper.includes(forbidden), "operational helper must not expose "+forbidden);
}
assert.doesNotMatch(checkout,/console\.error\(/);
assert.doesNotMatch(portal,/console\.error\(/);
assert.doesNotMatch(webhook,/Stripe webhook processing failed/);

console.log("Stage 57 operational observability regression passed.");
