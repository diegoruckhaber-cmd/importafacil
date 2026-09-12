import assert from "node:assert/strict";
import fs from "node:fs";
import { calculateUnifiedImportSimulation } from "../lib/unified-import-simulation.ts";
import { runImportSimulationV2 } from "../lib/simulation-v2.ts";

const item = {
  itemId: "ITEM-001",
  name: "Verniz",
  ncm: "32081020",
  origin: "México",
  quantity: 10,
  weightKg: 100,
  fobUnit: 20,
  icms: 17,
  ttd: "none",
  destination: "commercial_resale",
};

const base = {
  date: "2026-09-10",
  exchange: 5.5,
  freight: 100,
  insurance: 10,
  transportMode: "air",
  declarationType: "di",
  items: [item],
};

const explicitSc = calculateUnifiedImportSimulation({ ...base, destinationUf: "sc" });
assert.equal(explicitSc.jurisdiction.destinationUf, "SC");
assert.equal(explicitSc.jurisdiction.stateEngine, "SC");
assert.equal(explicitSc.jurisdiction.status, "homologated");
assert.deepEqual(explicitSc.jurisdiction.homologatedUfs, ["SC", "SP"]);
assert.equal(explicitSc.operation.destinationUf, "SC");
assert(explicitSc.calculation.totalLandedCostAfterBenefit > 0);

const legacyScDefault = calculateUnifiedImportSimulation(base);
assert.equal(legacyScDefault.jurisdiction.destinationUf, "SC", "legacy callers remain explicitly scoped to the existing SC engine");

const sp = calculateUnifiedImportSimulation({ ...base, destinationUf: "SP" });
assert.equal(sp.jurisdiction.destinationUf, "SP");
assert.equal(sp.jurisdiction.stateEngine, "GENERAL");
assert.equal(sp.jurisdiction.scope, "general_rate_only");
assert.equal(sp.calculation.items[0].icmsNormalRate, 18, "SP general rate must override manual item ICMS input");
assert.equal(sp.calculation.items[0].icmsImportEffectiveRate, 18);
assert.equal(sp.calculation.items[0].importICMSSavings, 0);
assert(sp.calculation.items[0].normalImportICMS > 0);

for (const uf of ["ES", "PE", "PR", "RO", "MG", "MS", "RJ"]) {
  assert.throws(
    () => calculateUnifiedImportSimulation({ ...base, destinationUf: uf }),
    new RegExp(`UF ${uf} não homologada`, "i"),
    `${uf} must fail closed instead of receiving another state's rules`,
  );
}

assert.throws(
  () => calculateUnifiedImportSimulation({ ...base, destinationUf: "SP", items: [{ ...item, ttd: "409" }] }),
  /apenas para a regra geral de ICMS/i,
);
assert.throws(
  () => calculateUnifiedImportSimulation({ ...base, destinationUf: "Santa Catarina" }),
  /UF válida com 2 letras/i,
);

const v2Sc = runImportSimulationV2({ ...base, destinationUf: "SC", scenarioName: "SC homologada", targetMarginPercent: 20 });
assert.equal(v2Sc.jurisdiction?.destinationUf, "SC");
assert(v2Sc.summary?.landedCostBrl > 0);

const v2Sp = runImportSimulationV2({ ...base, destinationUf: "SP", scenarioName: "SP regra geral", targetMarginPercent: 20 });
assert.equal(v2Sp.jurisdiction?.destinationUf, "SP");
assert(v2Sp.summary?.landedCostBrl > 0);
assert.notEqual(v2Sp.status, "blocked");

const v2Es = runImportSimulationV2({ ...base, destinationUf: "ES", scenarioName: "ES fora do escopo", targetMarginPercent: 20 });
assert.equal(v2Es.status, "blocked");
assert.equal(v2Es.summary, null);
assert(v2Es.issues.some((issue) => issue.code === "state_jurisdiction_unsupported"));

const route = fs.readFileSync("app/api/sc-federal-calculate/route.ts", "utf8");
assert.match(route, /destinationUf/);
assert.match(route, /body\.uf/);

console.log("State jurisdiction scope: OK — SC full, SP general-rate-only, remaining UFs fail closed across core and Simulation V2");
