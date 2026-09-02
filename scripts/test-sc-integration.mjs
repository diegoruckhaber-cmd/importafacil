import assert from "node:assert/strict";
import { calculateSCItem, calculateSCItems } from "../lib/sc-tributary-integration.ts";

const baseTributary = {
  valorAduaneiro: 100000,
  iiRate: 10,
  ipiRate: 5,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsRate: 17,
};

const commercial409 = calculateSCItem({
  id: "A",
  ttd: 409,
  destination: "commercial_resale",
  importEntryInSC: true,
  validConcession: true,
  tributary: baseTributary,
});
assert.equal(commercial409.decision.decision, "apply");
assert.equal(commercial409.decision.benefit, "TTD 409");
assert.ok(commercial409.taxes);
assert.ok(Math.abs((commercial409.taxes?.totalTributos ?? 0) - 53313.2530120482) < 0.01);

const deniedConcession = calculateSCItem({
  id: "B",
  ttd: 410,
  destination: "commercial_resale",
  importEntryInSC: true,
  validConcession: false,
  tributary: baseTributary,
});
assert.equal(deniedConcession.decision.decision, "deny");
assert.equal(deniedConcession.taxes, null);

const industrial410 = calculateSCItem({
  id: "C",
  ttd: 410,
  destination: "industrialization",
  importEntryInSC: true,
  validConcession: true,
  tributary: baseTributary,
});
assert.equal(industrial410.decision.decision, "conditional");
assert.equal(industrial410.taxes, null);

const mixed = calculateSCItems([
  {
    id: "A",
    ttd: 410,
    destination: "commercial_resale",
    importEntryInSC: true,
    validConcession: true,
    tributary: baseTributary,
  },
  {
    id: "B",
    ttd: 410,
    destination: "industrialization",
    importEntryInSC: true,
    validConcession: true,
    tributary: { ...baseTributary, valorAduaneiro: 50000 },
  },
]);
assert.equal(mixed.length, 2);
assert.equal(mixed[0].decision.decision, "apply");
assert.equal(mixed[1].decision.decision, "conditional");
assert.ok(mixed[0].taxes);
assert.equal(mixed[1].taxes, null);

const blocked = calculateSCItem({
  id: "D",
  ttd: 409,
  destination: "commercial_resale",
  importEntryInSC: true,
  validConcession: true,
  decree2128Prohibited: true,
  tributary: baseTributary,
});
assert.equal(blocked.decision.decision, "deny");
assert.equal(blocked.taxes, null);

console.log("SC integration tests: PASS");
console.log("- TTD 409 eligible commercial import: PASS");
console.log("- missing concession blocks benefit: PASS");
console.log("- TTD 410 industrial destination remains conditional: PASS");
console.log("- multi-item decisions are independent: PASS");
console.log("- Decreto 2.128 block prevents calculation: PASS");
