import assert from "node:assert/strict";
import { calculateUnifiedImportSimulation } from "../lib/unified-import-simulation.ts";

const close = (actual, expected, tolerance = 0.01, label = "value") => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
};

// Independent allocation memory for the documented E2E customs contract:
// - freight follows net weight;
// - insurance follows FOB value.
// Deliberately make FOB and weight proportions different so a value-based freight fallback cannot pass.
const result = calculateUnifiedImportSimulation({
  date: "2026-09-10",
  exchange: 5,
  freight: 1000,   // R$ 5,000
  insurance: 100, // R$ 500
  storage: 0,
  otherBrl: 0,
  transportMode: "air",
  declarationType: "di",
  additions: 2,
  items: [
    {
      itemId: "LIGHT-HIGH-VALUE",
      name: "Item leve",
      ncm: "32081020",
      origin: "México",
      quantity: 100,
      weightKg: 100,
      fobUnit: 10, // R$ 5,000 FOB -> 1/3 do FOB total
      icms: 17,
      ttd: "none",
      destination: "commercial_resale",
    },
    {
      itemId: "HEAVY-HIGHER-VALUE",
      name: "Item pesado",
      ncm: "32081020",
      origin: "México",
      quantity: 100,
      weightKg: 900,
      fobUnit: 20, // R$ 10,000 FOB -> 2/3 do FOB total
      icms: 17,
      ttd: "none",
      destination: "commercial_resale",
    },
  ],
});

const light = result.items.find((item) => item.itemId === "LIGHT-HIGH-VALUE");
const heavy = result.items.find((item) => item.itemId === "HEAVY-HIGHER-VALUE");
assert.ok(light && heavy);

// Freight: 10% / 90% according to weight.
close(light.allocatedFreightBrl, 500, 0.001, "light freight");
close(heavy.allocatedFreightBrl, 4500, 0.001, "heavy freight");
close(light.allocatedFreightBrl + heavy.allocatedFreightBrl, 5000, 0.001, "freight conservation");

// Insurance: 1/3 / 2/3 according to FOB.
close(light.allocatedInsuranceBrl, 500 / 3, 0.001, "light insurance");
close(heavy.allocatedInsuranceBrl, 1000 / 3, 0.001, "heavy insurance");
close(light.allocatedInsuranceBrl + heavy.allocatedInsuranceBrl, 500, 0.001, "insurance conservation");

// Customs-base expenses inside the monetary engine must use the same allocation contract.
close(light.calculation.allocatedCustomsBaseExpenses, 500 + 500 / 3, 0.01, "light customs-base expenses");
close(heavy.calculation.allocatedCustomsBaseExpenses, 4500 + 1000 / 3, 0.01, "heavy customs-base expenses");
close(result.calculation.totalCustomsValue, 20500, 0.01, "total customs value");

// Mandatory fail-closed case from docs/end-to-end-test-case-01.md.
assert.throws(() => calculateUnifiedImportSimulation({
  date: "2026-09-10",
  exchange: 5,
  freight: 1000,
  insurance: 0,
  transportMode: "air",
  declarationType: "di",
  items: [
    { itemId: "ZERO-WEIGHT-A", ncm: "32081020", origin: "México", quantity: 1, weightKg: 0, fobUnit: 10, icms: 17, ttd: "none" },
    { itemId: "ZERO-WEIGHT-B", ncm: "32081020", origin: "México", quantity: 1, weightKg: 0, fobUnit: 20, icms: 17, ttd: "none" },
  ],
}), /peso líquido total/i);

console.log("E2E customs allocation homologation: OK — freight by net weight, insurance by FOB, zero-weight freight fails closed");
