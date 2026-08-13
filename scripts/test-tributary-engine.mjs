import assert from "node:assert/strict";
import { calculateTributaryOperation } from "../lib/tributary-engine.ts";

const baseInput = {
  valorAduaneiro: 100000,
  iiRate: 10,
  ipiRate: 5,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsRate: 17,
};

const result = calculateTributaryOperation(baseInput);

// Baseline case: VA 100k; II 10%; IPI 5%; PIS 2.1%; COFINS 9.65%; ICMS 17% por dentro.
assert.equal(result.ii.calculated, 10000);
assert.equal(result.ipi.calculated, 5500);
assert.equal(result.pisImport.calculated, 2100);
assert.equal(result.cofinsImport.calculated, 9650);
assert.ok(Math.abs(result.icms.calculated - 26063.253012048197) < 0.000001);
assert.ok(Math.abs(result.totalTributos - 53313.2530120482) < 0.000001);

// Operational costs are not silently injected into the ICMS base.
const withOperationalCost = calculateTributaryOperation({
  ...baseInput,
  otherBrl: 25000,
});
assert.equal(withOperationalCost.other, 25000);
assert.equal(withOperationalCost.icmsTaxableAdditions, 0);
assert.equal(withOperationalCost.icms.base, result.icms.base);

// Explicitly taxable additions must affect the ICMS base.
const withTaxableAddition = calculateTributaryOperation({
  ...baseInput,
  icmsTaxableAdditionsBrl: 25000,
});
assert.ok(withTaxableAddition.icms.base > result.icms.base);

// Invalid rates and negative monetary inputs must fail loudly.
assert.throws(() => calculateTributaryOperation({ ...baseInput, icmsRate: 100 }));
assert.throws(() => calculateTributaryOperation({ ...baseInput, valorAduaneiro: -1 }));
assert.throws(() => calculateTributaryOperation({ ...baseInput, iiRate: Number.NaN }));

console.log("PASS: tributary engine smoke suite (5 scenarios)");
