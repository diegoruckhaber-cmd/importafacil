import assert from "node:assert/strict";
import { calculateSCMultiItemFinalCost } from "../lib/sc-multi-item-final-cost-engine.ts";

// Locked MVP acceptance scenario: two products, shared import costs,
// different SC treatments and an operational expense allocated by weight.
const items = [
  {
    itemId: "ITEM-1",
    customsValue: 1000 * 10 * 5.5,
    quantity: 1000,
    weightKg: 1000,
    volumeM3: 1,
    iiRate: 10,
    ipiRate: 5,
    pisImportRate: 2.1,
    cofinsImportRate: 9.65,
    icmsRate: 17,
  },
  {
    itemId: "ITEM-2",
    customsValue: 500 * 18 * 5.5,
    quantity: 500,
    weightKg: 750,
    volumeM3: 1.5,
    iiRate: 10,
    ipiRate: 5,
    pisImportRate: 2.1,
    cofinsImportRate: 9.65,
    icmsRate: 17,
  },
];

const result = calculateSCMultiItemFinalCost({
  items,
  expenses: [
    { id: "FREIGHT", description: "Frete internacional", amount: 1200 * 5.5, treatment: "customs_base", allocation: "item_value" },
    { id: "INSURANCE", description: "Seguro internacional", amount: 100 * 5.5, treatment: "customs_base", allocation: "item_value" },
    { id: "ARM-001", description: "Armazenagem", amount: 3500, treatment: "operational_cost", allocation: "weight" },
  ],
  benefitsByItem: {},
});

assert.equal(result.items.length, 2);
assert.equal(result.status, "calculated");
assert.equal(result.totalAllocatedExpenses, 1200 * 5.5 + 100 * 5.5 + 3500);
assert.ok(result.totalCustomsValue > 0);
assert.ok(result.totalNormalTaxes > 0);
assert.ok(result.totalLandedCostBeforeBenefit > result.totalCustomsValue);
assert.equal(result.totalLandedCostAfterBenefit, result.totalLandedCostBeforeBenefit);

for (const item of result.items) {
  assert.ok(item.taxLines.ii);
  assert.ok(item.taxLines.ipi);
  assert.ok(item.taxLines.pisImport);
  assert.ok(item.taxLines.cofinsImport);
  assert.ok(item.taxLines.icms);
  assert.ok(item.landedCostPerUnitAfterBenefit > 0);
  assert.equal(item.customsValue, item.effectiveCustomsValue - item.allocatedCustomsBaseExpenses);
}

console.log("PASS: MVP SC operation acceptance scenario");
console.log(JSON.stringify({
  status: result.status,
  totalCustomsValue: result.totalCustomsValue,
  totalAllocatedExpenses: result.totalAllocatedExpenses,
  totalNormalTaxes: result.totalNormalTaxes,
  totalLandedCostAfterBenefit: result.totalLandedCostAfterBenefit,
  items: result.items.map((item) => ({
    itemId: item.itemId,
    customsValue: item.customsValue,
    allocatedExpensesTotal: item.allocatedExpensesTotal,
    normalTaxTotal: item.normalTaxTotal,
    landedCostAfterBenefit: item.landedCostAfterBenefit,
    landedCostPerUnitAfterBenefit: item.landedCostPerUnitAfterBenefit,
  })),
}, null, 2));
