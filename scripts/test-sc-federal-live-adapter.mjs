import assert from "node:assert/strict";
import { resolveSCFederalItem } from "../lib/sc-federal-live-adapter.ts";

const normal = resolveSCFederalItem({
  date: "2026-08-15",
  iiRate: 10,
  ipiRate: 5,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
});

assert.equal(normal.pisImportRate, 2.1);
assert.equal(normal.cofinsImportRate, 9.65);
assert.equal(normal.iiRate, 10);
assert.equal(normal.ipiRate, 5);
assert.equal(normal.requiresManualFederalInput, false);

const reduced = resolveSCFederalItem({
  date: "2026-08-15",
  iiRate: 10,
  ipiRate: 5,
  cofinsImportRate: 9.65,
  cofinsReducedBenefit: true,
});

assert.equal(reduced.cofinsImportRate, 0.965);
assert.equal(reduced.cofinsDisplayRate, 0.97);

const reducedWithAdditional = resolveSCFederalItem({
  date: "2026-08-15",
  iiRate: 10,
  ipiRate: 5,
  cofinsImportRate: 9.65,
  cofinsReducedBenefit: true,
  cofinsAdditional060: true,
});

assert.equal(reducedWithAdditional.cofinsImportRate, 1.565);
assert.equal(reducedWithAdditional.cofinsDisplayRate, 1.57);

const conservative = resolveSCFederalItem({ date: "2026-08-15" });
assert.equal(conservative.iiRate, null);
assert.equal(conservative.ipiRate, null);
assert.equal(conservative.requiresManualFederalInput, true);
assert.ok(conservative.warnings.length >= 2);

console.log("SC federal live adapter: all acceptance tests passed.");
