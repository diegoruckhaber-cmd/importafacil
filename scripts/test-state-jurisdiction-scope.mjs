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
assert.deepEqual(explicitSc.jurisdiction.homologatedUfs, ["SC"]);
assert.equal(explicitSc.operation.destinationUf, "SC");
assert(explicitSc.calculation.totalLandedCostAfterBenefit > 0);

const legacyScDefault = calculateUnifiedImportSimulation(base);
assert.equal(legacyScDefault.jurisdiction.destinationUf, "SC", "legacy callers remain explicitly scoped to the existing SC engine");

for (const uf of ["SP", "ES", "PE", "PR", "RO", "MG", "MS", "RJ"]) {
  assert.throws(
    () => calculateUnifiedImportSimulation({ ...base, destinationUf: uf }),
    new RegExp(`UF ${uf} não homologada`, "i"),
    `${uf} must fail closed instead of receiving SC rules`,
  );
}

assert.throws(
  () => calculateUnifiedImportSimulation({ ...base, destinationUf: "Santa Catarina" }),
  /UF válida com 2 letras/i,
);

const v2Sc = runImportSimulationV2({ ...base, destinationUf: "SC", scenarioName: "SC homologada", targetMarginPercent: 20 });
assert.equal(v2Sc.jurisdiction?.destinationUf, "SC");
assert(v2Sc.summary?.landedCostBrl > 0);

const v2Sp = runImportSimulationV2({ ...base, destinationUf: "SP", scenarioName: "SP fora do escopo", targetMarginPercent: 20 });
assert.equal(v2Sp.status, "blocked");
assert.equal(v2Sp.summary, null);
assert(v2Sp.issues.some((issue) => issue.code === "state_jurisdiction_unsupported"));
assert(v2Sp.attentionPoints.some((message) => /UF SP não homologada/i.test(message)));

const route = fs.readFileSync("app/api/sc-federal-calculate/route.ts", "utf8");
assert.match(route, /destinationUf/);
assert.match(route, /body\.uf/);

console.log("State jurisdiction scope: OK — SC homologated, non-SC UFs fail closed across core and Simulation V2");
