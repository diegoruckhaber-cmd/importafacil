import assert from "node:assert/strict";
import { SC_BENEFIT_TESTS, countCriticalSCBenefitTests } from "../lib/sc-benefit-test-matrix.ts";
import { SC_DECISION_REGRESSION_CASES, SC_DECISION_REGRESSION_CASE_COUNT } from "../lib/sc-decision-regression-cases.ts";

assert.equal(SC_BENEFIT_TESTS.length, 15, "SC benefit matrix must contain 15 scenarios");
assert.equal(SC_DECISION_REGRESSION_CASE_COUNT, 13, "SC decision regression corpus must contain 13 scenarios");
assert.equal(SC_DECISION_REGRESSION_CASES.length, SC_DECISION_REGRESSION_CASE_COUNT);
assert.ok(countCriticalSCBenefitTests() >= 8, "Critical SC coverage unexpectedly decreased");

const ids = SC_BENEFIT_TESTS.map((test) => test.id);
assert.equal(new Set(ids).size, ids.length, "SC benefit test IDs must be unique");

for (const test of SC_BENEFIT_TESTS) {
  assert.ok(test.id && test.title && test.source && test.expected, `Incomplete SC benefit test: ${test.id}`);
  assert.ok(test.facts.length > 0, `SC benefit test has no facts: ${test.id}`);
}

const regressionIds = SC_DECISION_REGRESSION_CASES.map((test) => test.id);
assert.equal(new Set(regressionIds).size, regressionIds.length, "SC regression IDs must be unique");
for (const test of SC_DECISION_REGRESSION_CASES) {
  assert.ok(["apply", "deny", "conditional"].includes(test.expectedDecision), `Invalid decision: ${test.id}`);
  assert.ok(test.legalBasis && test.rationale, `Incomplete legal evidence: ${test.id}`);
}

console.log(`PASS: SC test corpus integrity (${SC_BENEFIT_TESTS.length} benefit scenarios + ${SC_DECISION_REGRESSION_CASES.length} regression cases)`);
console.log("NOTE: this validates the test corpus only; it does not claim that the production decision engine has passed these scenarios.");
