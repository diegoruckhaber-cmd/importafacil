import assert from "node:assert/strict";
import fs from "node:fs";
import { summarizeHumanValidation } from "../lib/human-validation-readiness.ts";

const complete = summarizeHumanValidation([
  { id: "server_verified_v2", satisfied: true },
  { id: "live_pro_subscription", satisfied: true },
  { id: "pilot_response", satisfied: true },
]);
assert.equal(complete.status, "complete");

const pending = summarizeHumanValidation([
  { id: "server_verified_v2", satisfied: true },
  { id: "live_pro_subscription", satisfied: false },
  { id: "pilot_response", satisfied: false },
]);
assert.equal(pending.status, "pending");

const invalid = summarizeHumanValidation([
  { id: "server_verified_v2", satisfied: true },
]);
assert.equal(invalid.status, "unavailable");

const source = fs.readFileSync("lib/human-validation-readiness.ts", "utf8");
const route = fs.readFileSync("app/api/controlled-beta-readiness/route.ts", "utf8");

assert.match(source, /result->>contract/);
assert.match(source, /server_execution/);
assert.match(source, /status: "in\.\(active,trialing\)"/);
assert.match(source, /pilot_responses/);
assert.doesNotMatch(source, /email|message|blocker|pricing_comment/);
assert.match(route, /blocked_pending_human_validation/);
assert.match(route, /blocked_by_human_evidence_unavailable/);

console.log("Stage 76 human validation readiness regression passed.");
