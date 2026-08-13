import { allocateImportCost, validateAllocation } from "../lib/import-cost-allocation.ts";

const items = [
  { itemId: "A", customsValue: 70000, weightKg: 700 },
  { itemId: "B", customsValue: 30000, weightKg: 300 },
];

const byValue = allocateImportCost(10000, items, "item_value");
if (!validateAllocation(byValue, 10000)) throw new Error("Rateio por valor não fecha");
if (Math.round(byValue[0].allocatedCost) !== 7000) throw new Error("Rateio por valor incorreto");

const byWeight = allocateImportCost(10000, items, "weight");
if (!validateAllocation(byWeight, 10000)) throw new Error("Rateio por peso não fecha");
if (Math.round(byWeight[1].allocatedCost) !== 3000) throw new Error("Rateio por peso incorreto");

console.log("Import cost allocation: PASS");
