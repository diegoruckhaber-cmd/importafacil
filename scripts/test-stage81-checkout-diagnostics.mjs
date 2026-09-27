import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync("app/api/checkout/route.ts","utf8");

assert.match(route,/stripeError\.type/);
assert.match(route,/stripeError\.code/);
assert.match(route,/stripeError\.param/);
assert.match(route,/diagnosticCode/);
assert.match(route,/emit\("failed", diagnosticCode\)/);
assert.doesNotMatch(route,/console\.error\(/);
assert.doesNotMatch(route,/stripeError\.message/);

console.log("Stage 81 checkout diagnostics regression passed.");
