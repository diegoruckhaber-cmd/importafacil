import assert from "node:assert/strict";
import { decideSCItem, decideSCMultiItem } from "../lib/sc-decision-engine.ts";
import { SC_DECISION_REGRESSION_CASES } from "../lib/sc-decision-regression-cases.ts";

function productionInput(test) {
  const source = test.inputs ?? {};
  const input = { id: test.id, ...source };

  if (input.ttd !== undefined && input.validConcession === undefined && input.concessiveActValid === undefined) {
    input.validConcession = true;
  }

  if (input.ttd === 409 || input.ttd === 410) {
    if (input.destination === undefined && !input.decree2128Prohibited && !input.origin && !Number.isFinite(input.mercosurRelevantImportShare) && !input.hasSpecificBaseReduction) {
      input.destination = "commercial_resale";
    }
    if (input.importEntryInSC === undefined && !input.origin) input.importEntryInSC = true;
  }

  return input;
}

const observed = [];
for (const test of SC_DECISION_REGRESSION_CASES) {
  const result = decideSCItem(productionInput(test));
  observed.push({ id: test.id, expected: test.expectedDecision, actual: result.decision, issues: result.blockingIssues });
  assert.equal(result.decision, test.expectedDecision, `${test.id}: expected ${test.expectedDecision}, got ${result.decision}. ${result.reasons.join(" ")}`);
}

const independent = decideSCMultiItem([
  { id: "COMM", ttd: 409, destination: "commercial_resale", importEntryInSC: true, validConcession: true },
  { id: "IND", ttd: 410, destination: "industrialization", importEntryInSC: true, validConcession: true },
  { id: "BLOCK", ttd: 409, destination: "commercial_resale", importEntryInSC: true, validConcession: true, decree2128Prohibited: true },
]);
assert.deepEqual(independent.map((x) => x.decision), ["apply", "conditional", "deny"], "multi-item decisions must stay independent");

const transferWithoutElection = decideSCItem({ id: "TRANSFER-NO-ELECTION", ttd: "409/410", operation: "same_holder_interstate_transfer", taxableEventElection: false, validConcession: true });
assert.equal(transferWithoutElection.decision, "deny");
assert(transferWithoutElection.blockingIssues.includes("taxable_event_election_required"));

const thresholdBoundary = [49.99, 50].map((share) => decideSCItem({ id: `MERCOSUR-${share}`, mercosurRelevantImportShare: share }));
assert.equal(thresholdBoundary[0].decision, "deny");
assert.equal(thresholdBoundary[1].decision, "conditional");

console.log(JSON.stringify({ homologatedCases: observed.length, observed }, null, 2));
console.log(`SC production decision engine homologation: OK — ${observed.length}/${SC_DECISION_REGRESSION_CASES.length} legal regression cases matched`);
