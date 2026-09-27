import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync("app/api/checkout/route.ts","utf8");

assert.match(route,/billing\.checkout\.stripe_error/);
assert.match(route,/stripeError\.type/);
assert.match(route,/stripeError\.code/);
assert.match(route,/stripeError\.param/);
assert.match(route,/stripeError\.message/);
assert.doesNotMatch(route,/STRIPE_SECRET_KEY.*console/i);
assert.doesNotMatch(route,/customer_email.*console/i);

console.log("Stage 81 checkout diagnostics regression passed.");
