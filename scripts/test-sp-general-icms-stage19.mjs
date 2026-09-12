import assert from "node:assert/strict";
import { calculateUnifiedImportSimulation } from "../lib/unified-import-simulation.ts";
import { resolveGeneralStateIcmsRule } from "../lib/state-general-icms-rules.ts";
import { evaluateStateActivation } from "../lib/state-activation-guard.ts";

const close = (actual, expected, tolerance = 0.01) => {
  assert(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
};

const rule = resolveGeneralStateIcmsRule("sp");
assert(rule);
assert.equal(rule.ratePercent, 18);
assert.equal(rule.scope, "general_rate_only");
assert(rule.legalBasis.some((basis) => /art\. 52/i.test(basis)));

const input = {
  date: "2026-09-10",
  destinationUf: "SP",
  exchange: 5.5,
  freight: 100,
  insurance: 10,
  transportMode: "air",
  declarationType: "di",
  items: [{
    itemId: "ITEM-001",
    name: "Verniz",
    ncm: "32081020",
    origin: "México",
    quantity: 10,
    weightKg: 100,
    fobUnit: 20,
    icms: 4,
    ttd: "none",
    destination: "commercial_resale",
  }],
};

const result = calculateUnifiedImportSimulation(input);
assert.equal(result.jurisdiction.destinationUf, "SP");
assert.equal(result.jurisdiction.stateEngine, "GENERAL");
assert.equal(result.jurisdiction.scope, "general_rate_only");
assert.deepEqual(result.jurisdiction.homologatedUfs, ["SC", "SP"]);
assert.equal(result.state?.icmsGeneralRate, 18);
assert(result.state?.legalBasis.some((basis) => /art\. 52/i.test(basis)));

const row = result.calculation.items[0];
assert.equal(row.icmsNormalRate, 18, "user-provided ICMS must not override the homologated SP general rate");
assert.equal(row.icmsImportEffectiveRate, 18);
assert.equal(row.importICMSSavings, 0);
assert(row.normalImportICMS > 0);

const expectedPreBase = row.effectiveCustomsValue
  + row.taxLines.ii.payable
  + row.taxLines.ipi.payable
  + row.taxLines.pisImport.payable
  + row.taxLines.cofinsImport.payable
  + row.allocatedIcmsImportBaseExpenses;
const expectedBase = expectedPreBase / (1 - 0.18);
close(row.taxLines.icms.base, expectedBase);
close(row.taxLines.icms.payable, expectedBase * 0.18);
assert(result.warnings.some((warning) => /somente a alíquota geral de 18%/i.test(warning)));

assert.throws(
  () => calculateUnifiedImportSimulation({
    ...input,
    items: [{ ...input.items[0], ttd: "409" }],
  }),
  /apenas para a regra geral de ICMS/i,
);
assert.throws(() => calculateUnifiedImportSimulation({ ...input, destinationUf: "ES" }), /não homologada/i);

const activation = evaluateStateActivation();
assert.equal(activation.status, "safe");
assert.deepEqual(activation.activeUfs, ["SC", "SP"]);

console.log("Stage 19 SP general ICMS: OK — 18% canonical rate, shared por-dentro formula, no SC fallback, special regimes out of scope");
