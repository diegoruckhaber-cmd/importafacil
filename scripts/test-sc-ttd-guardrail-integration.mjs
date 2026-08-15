import assert from "node:assert/strict";
import { resolveSCBenefit } from "../lib/sc-benefit-resolution.ts";

const eligible = resolveSCBenefit({
  ttd: 410,
  destination: "commercial_resale",
  ncm: "3208.10.20",
  normalOutputICMS: 100,
  taxableOutput: true,
});
assert.notEqual(eligible.decision, "deny");

const missingNcm = resolveSCBenefit({
  ttd: 410,
  destination: "commercial_resale",
  normalOutputICMS: 100,
  taxableOutput: true,
});
assert.notEqual(missingNcm.decision, "deny");

const excluded = resolveSCBenefit({
  ttd: 410,
  destination: "commercial_resale",
  ncm: "2710.12.49",
  exclusionKnown: true,
  normalOutputICMS: 100,
  taxableOutput: true,
});
assert.equal(excluded.decision, "deny");
assert.ok(excluded.blockingIssues.includes("sc_ttd_guardrail_failed"));

console.log("SC TTD guardrail integration tests: OK");
