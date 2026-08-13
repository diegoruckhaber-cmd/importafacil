import assert from "node:assert/strict";
import { calculateItemTributaryOperation } from "../lib/item-tributary-expense-engine.ts";

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

const result = calculateItemTributaryOperation(items, [
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
  {
    id: "COND-001",
    description: "Despesa condicional",
    amount: 1000,
    treatment: "conditional",
    allocation: "quantity",
  },
  {
    id: "DIRECT-001",
    description: "Despesa diretamente atribuível ao item B",
    amount: 500,
    treatment: "operational_cost",
    itemId: "B",
  },
]);

const itemA = result.items.find((item) => item.itemId === "A");
const itemB = result.items.find((item) => item.itemId === "B");

assert.ok(itemA);
assert.ok(itemB);

assert.equal(itemA.allocatedCustomsBaseExpenses, 7000);
assert.equal(itemB.allocatedCustomsBaseExpenses, 3000);
assert.equal(itemA.effectiveCustomsValue, 77000);
assert.equal(itemB.effectiveCustomsValue, 33000);

assert.equal(itemA.allocatedIcmsImportBaseExpenses, 1400);
assert.equal(itemB.allocatedIcmsImportBaseExpenses, 600);
assert.equal(itemA.allocatedOperationalExpenses, 3500);
assert.equal(itemB.allocatedOperationalExpenses, 2000);
assert.equal(itemA.allocatedConditionalExpenses, 700);
assert.equal(itemB.allocatedConditionalExpenses, 300);

assert.equal(result.totalAllocatedExpenses, 18500);
assert.equal(result.warnings.length, 1);
assert.ok(itemA.taxes.totalTributos > 0);
assert.ok(itemB.taxes.totalTributos > 0);
assert.ok(itemA.landedCost > itemA.effectiveCustomsValue);
assert.ok(itemB.landedCost > itemB.effectiveCustomsValue);

assert.throws(
  () => calculateItemTributaryOperation(items, [
    {
      id: "INVALID-001",
      description: "Despesa compartilhada sem critério",
      amount: 100,
      treatment: "operational_cost",
    },
  ]),
  /precisa informar o critério de rateio/,
);

assert.throws(
  () => calculateItemTributaryOperation(items, [
    {
      id: "INVALID-002",
      description: "Despesa em item inexistente",
      amount: 100,
      treatment: "operational_cost",
      itemId: "C",
    },
  ]),
  /item inexistente/,
);

console.log("OK: item tributary expense engine");
console.log(JSON.stringify(result, null, 2));
