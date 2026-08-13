import assert from "node:assert/strict";
import { calculateSCMultiItemFinalCost } from "../lib/sc-multi-item-final-cost-engine.ts";

// Golden scenario: two items with different tax treatment, shared expenses,
// one SC import benefit and one normal item.
const items = [
  {
    itemId: "A",
    customsValue: 77000,
    quantity: 700,
    weightKg: 900,
    volumeM3: 1.8,
    iiRate: 12,
    ipiRate: 5,
    pisImportRate: 2.1,
    cofinsImportRate: 9.65,
    icmsRate: 17,
  },
  {
    itemId: "B",
    customsValue: 33000,
    quantity: 300,
    weightKg: 100,
    volumeM3: 0.2,
    iiRate: 4,
    ipiRate: 0,
    pisImportRate: 1.65,
    cofinsImportRate: 7.6,
    icmsRate: 12,
  },
];

const result = calculateSCMultiItemFinalCost({
  items,
  expenses: [
    {
      id: "FREIGHT",
      description: "Frete internacional",
      amount: 10000,
      treatment: "customs_base",
      allocation: "item_value",
    },
    {
      id: "PORT",
      description: "Despesa portuária operacional",
      amount: 4000,
      treatment: "operational_cost",
      allocation: "weight",
    },
    {
      id: "ICMS-ADD",
      description: "Acréscimo tributável no ICMS",
      amount: 2000,
      treatment: "icms_import_base",
      allocation: "volume",
    },
  ],
  benefitsByItem: {
    A: {
      decision: "apply",
      importDeferred: true,
      outputPresumedCredit: true,
      benefitICMS: null,
      estimatedSavings: null,
      reasons: ["Benefício de importação validado"],
      blockingIssues: [],
      source: "golden-test",
    },
  },
});

const a = result.items.find((item) => item.itemId === "A");
const b = result.items.find((item) => item.itemId === "B");
assert.ok(a && b);

// Allocation conservation.
assert.equal(result.totalAllocatedExpenses, 16000);
assert.equal(result.totalImportICMSSavings, a.importICMSSavings);

// Different rates remain independent: the two items must not be recalculated
// as if the operation had one blended tax profile.
assert.notEqual(a.normalTaxTotal, b.normalTaxTotal);
assert.notEqual(a.benefitTaxTotal, b.benefitTaxTotal);

// Only item A receives the validated import-stage deferral.
assert.ok(a.importICMSSavings > 0);
assert.equal(b.importICMSSavings, 0);
assert.equal(a.landedCostAfterBenefit, a.landedCostBeforeBenefit - a.importICMSSavings);
assert.equal(b.landedCostAfterBenefit, b.landedCostBeforeBenefit);

// Consolidated totals equal the sum of item results.
assert.equal(result.totalNormalTaxes, a.normalTaxTotal + b.normalTaxTotal);
assert.equal(result.totalBenefitTaxes, a.benefitTaxTotal + b.benefitTaxTotal);
assert.equal(result.totalLandedCostBeforeBenefit, a.landedCostBeforeBenefit + b.landedCostBeforeBenefit);
assert.equal(result.totalLandedCostAfterBenefit, a.landedCostAfterBenefit + b.landedCostAfterBenefit);
assert.equal(result.status, "calculated");
assert.equal(result.warnings.length, 0);

console.log("PASS: golden multi-item import operation");
console.log(JSON.stringify(result, null, 2));
