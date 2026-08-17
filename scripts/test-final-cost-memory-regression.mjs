import assert from "node:assert/strict";
import { calculateSCMultiItemFinalCost } from "../lib/sc-multi-item-final-cost-engine.ts";

// Regression: the final-cost layer must expose the complete item tax memory
// consumed by the operation UI, while preserving expense allocation and the
// backward-compatible aliases used by the current memory panel.
const result = calculateSCMultiItemFinalCost({
  items: [
    {
      itemId: "MEM-A",
      customsValue: 100000,
      quantity: 1000,
      weightKg: 700,
      volumeM3: 1,
      iiRate: 10,
      ipiRate: 5,
      pisImportRate: 2.1,
      cofinsImportRate: 9.65,
      icmsRate: 17,
    },
    {
      itemId: "MEM-B",
      customsValue: 30000,
      quantity: 300,
      weightKg: 300,
      volumeM3: 0.5,
      iiRate: 4,
      ipiRate: 0,
      pisImportRate: 1.65,
      cofinsImportRate: 7.6,
      icmsRate: 12,
    },
  ],
  expenses: [
    {
      id: "FREIGHT",
      description: "Frete",
      amount: 6000,
      treatment: "customs_base",
      allocation: "item_value",
    },
    {
      id: "STORAGE",
      description: "Armazenagem",
      amount: 4000,
      treatment: "operational_cost",
      allocation: "weight",
    },
  ],
});

assert.equal(result.status, "calculated");
assert.equal(result.totalAllocatedExpenses, 10000);

for (const item of result.items) {
  // customsValue is the backward-compatible original value; the effective
  // value includes allocated customs-base expenses.
  assert.equal(item.customsValue, item.baseCustomsValue);
  assert.equal(item.allocatedExpensesTotal, item.totalAllocatedExpenses);
  assert.ok(item.taxLines.ii);
  assert.ok(item.taxLines.ipi);
  assert.ok(item.taxLines.pisImport);
  assert.ok(item.taxLines.cofinsImport);
  assert.ok(item.taxLines.icms);
  assert.equal(
    item.normalTaxTotal,
    item.taxLines.ii.value +
      item.taxLines.ipi.value +
      item.taxLines.pisImport.value +
      item.taxLines.cofinsImport.value +
      item.taxLines.icms.value,
  );
  assert.ok(item.landedCostAfterBenefit >= 0);
  assert.ok(item.landedCostPerUnitAfterBenefit >= 0);
}

assert.equal(
  result.totalNormalTaxes,
  result.items.reduce((sum, item) => sum + item.normalTaxTotal, 0),
);
assert.equal(
  result.totalLandedCostAfterBenefit,
  result.items.reduce((sum, item) => sum + item.landedCostAfterBenefit, 0),
);

console.log("PASS: final-cost memory regression");
