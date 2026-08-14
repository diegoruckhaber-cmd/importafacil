import assert from "node:assert/strict";
import { resolveFederalTaxes } from "../lib/federal-tax-resolution.ts";

const standard = resolveFederalTaxes({ date: "2026-03-31", statutoryIIRate: 12, ipiRate: 5 });
assert.equal(standard.pisImportRate, 2.1);
assert.equal(standard.cofinsImportRate, 9.65);
assert.equal(standard.iiRate, 12);
assert.equal(standard.ipiRate, 5);

const reduced = resolveFederalTaxes({
  date: "2026-04-01",
  statutoryIIRate: 12,
  ipiRate: 5,
  cofinsReducedBenefit: true,
  cofinsAdditional060: false,
});
assert.equal(reduced.cofinsImportRate, 0.965);
assert.equal(reduced.cofinsDisplayRate, 0.97);

const reducedPlus = resolveFederalTaxes({
  date: "2026-04-01",
  statutoryIIRate: 12,
  ipiRate: 5,
  cofinsReducedBenefit: true,
  cofinsAdditional060: true,
});
assert.equal(reducedPlus.cofinsImportRate, 1.565);
assert.equal(reducedPlus.cofinsDisplayRate, 1.57);

const unresolved = resolveFederalTaxes({ date: "2026-08-14" });
assert.equal(unresolved.iiRate, null);
assert.equal(unresolved.ipiRate, null);
assert.ok(unresolved.warnings.some((warning) => warning.includes("II")));
assert.ok(unresolved.warnings.some((warning) => warning.includes("IPI")));

console.log("PASS: unified federal tax resolution");
