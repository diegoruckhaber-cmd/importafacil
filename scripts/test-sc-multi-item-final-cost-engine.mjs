import assert from "node:assert/strict";
import { calculateSCMultiItemFinalCost } from "../lib/sc-multi-item-final-cost-engine.ts";

const items = [
  {
    itemId: "A",
    customsValue: 70000,
    quantity: 700,
    weightKg: 700,
    volumeM3: 0.7,
    iiRate: 10,
    ipiRate: 5,
    pisImportRate: 2.1,
    cofinsImportRate: 9.65,
    icmsRate: 17,
  },
  {
    itemId: "B",
    customsValue: 30000,
    quantity: 300,
    weightKg: 300,
    volumeM3: 0.3,
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
    {
      id: "FRETE-001",
      description: "Despesa comum que integra valor aduaneiro",
      amount: 10000,
      treatment: "customs_base",
      allocation: "item_value",
    },
    {
      id: "ACRESC-001",
      description: "Acréscimo tributável somente no ICMS",
      amount: 2000,
      treatment: "icms_import_base",
      allocation: "weight",
    },
    {
      id: "ARM-001",
      description: "Armazenagem operacional",
      amount: 5000,
      treatment: "operational_cost",
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
      reasons: ["TTD 409/410 validado"],
      blockingIssues: [],
      source: "catalog",
    },
    B: {
      decision: "conditional",
      importDeferred: false,
      outputPresumedCredit: false,
      benefitICMS: null,
      estimatedSavings: null,
      reasons: ["Destinação pendente"],
      blockingIssues: ["destination_required"],
      source: "catalog",
    },
  },
});

const itemA = result.items.find((item) => item.itemId === "A");
const itemB = result.items.find((item) => item.itemId === "B");

assert.ok(itemA);
assert.ok(itemB);
assert.equal(result.totalAllocatedExpenses, 17000);
assert.equal(result.totalImportICMSSavings, itemA.importICMSSavings);
assert.equal(itemA.benefit.decision, "apply");
assert.equal(itemA.benefit.importDeferred, true);
assert.equal(itemA.benefitTaxTotal, itemA.normalTaxTotal - itemA.importICMSSavings);
assert.equal(itemA.landedCostAfterBenefit, itemA.landedCostBeforeBenefit - itemA.importICMSSavings);
assert.equal(itemB.importICMSSavings, 0);
assert.equal(itemB.landedCostAfterBenefit, itemB.landedCostBeforeBenefit);
assert.equal(result.totalLandedCostAfterBenefit, result.totalLandedCostBeforeBenefit - result.totalImportICMSSavings);
assert.equal(result.status, "conditional");
assert.equal(result.warnings.length, 1);

console.log("SC multi-item final cost engine: PASS");
console.log(JSON.stringify(result, null, 2));
