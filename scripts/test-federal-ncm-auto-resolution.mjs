import assert from "node:assert/strict";
import { resolveFederalTaxes } from "../lib/federal-tax-resolution.ts";

const result = resolveFederalTaxes({ ncm: "3208.10.20", date: "2026-08-15" });
assert.equal(result.iiRate, 12.6);
assert.equal(result.ipiRate, 3.25);
assert.equal(result.automatic.ii, true);
assert.equal(result.automatic.ipi, true);
assert.equal(result.automatic.pisImport, true);
// NCM lookup alone must not invent a reduced Cofins benefit. The reduced
// benefit is an operation/legal-treatment input and is tested explicitly in
// test-federal-tax-resolution.mjs.
assert.equal(result.cofinsImportRate, 9.65);

const reduced = resolveFederalTaxes({
  ncm: "3208.10.20",
  date: "2026-08-15",
  cofinsReducedBenefit: true,
  cofinsAdditional060: false,
});
assert.equal(reduced.cofinsImportRate, 0.965);
assert.equal(reduced.cofinsDisplayRate, 0.97);

const unknown = resolveFederalTaxes({ ncm: "9999.99.99", date: "2026-08-15" });
assert.equal(unknown.iiRate, null);
assert.equal(unknown.ipiRate, null);
assert.equal(unknown.automatic.ii, false);
assert.equal(unknown.automatic.ipi, false);
assert.ok(unknown.warnings.length >= 2);

console.log("Federal NCM automatic resolution acceptance: OK");
