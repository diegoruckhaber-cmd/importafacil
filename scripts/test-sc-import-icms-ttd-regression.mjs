import assert from "node:assert/strict";
import { resolveSCBenefit } from "../lib/sc-benefit-resolution.ts";
import { calculateSCMultiItemFinalCost } from "../lib/sc-multi-item-final-cost-engine.ts";

function baseItem(itemId, icmsRate = 17) {
  return {
    itemId,
    customsValue: 100000,
    quantity: 1000,
    weightKg: 1000,
    volumeM3: 1,
    iiRate: 10,
    ipiRate: 5,
    pisImportRate: 2.1,
    cofinsImportRate: 9.65,
    icmsRate,
  };
}

function noExpenses() {
  return [];
}

const normal = calculateSCMultiItemFinalCost({
  items: [baseItem("NORMAL")],
  expenses: noExpenses(),
});
const normalItem = normal.items[0];
assert.equal(normalItem.icmsNormalRate, 17);
assert.equal(normalItem.icmsImportEffectiveRate, 17);
assert.equal(normalItem.importICMSSavings, 0);
assert.equal(normal.totalNormalImportICMS, normal.totalEffectiveImportICMS);

for (const ttd of [409, 410]) {
  const benefit = resolveSCBenefit({
    ttd,
    destination: "commercial_resale",
    taxableOutput: true,
    normalOutputICMS: 0,
  });

  assert.equal(benefit.decision, "apply", `TTD ${ttd} should be applicable in the isolated regression case`);
  assert.equal(benefit.importDeferred, true, `TTD ${ttd} must defer import ICMS`);

  const result = calculateSCMultiItemFinalCost({
    items: [baseItem(`TTD-${ttd}`)],
    expenses: noExpenses(),
    benefitsByItem: { [`TTD-${ttd}`]: benefit },
  });
  const item = result.items[0];

  assert.equal(item.icmsNormalRate, 17);
  assert.equal(item.icmsImportEffectiveRate, 0);
  assert.equal(item.benefitImportICMS, 0);
  assert.equal(item.importICMSSavings, item.normalImportICMS);
  assert.equal(result.totalNormalImportICMS, item.normalImportICMS);
  assert.equal(result.totalEffectiveImportICMS, 0);
  assert.equal(result.totalImportICMSSavings, item.normalImportICMS);
}

console.log("PASS: SC import ICMS regression — normal, TTD 409 and TTD 410");
