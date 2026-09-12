import assert from "node:assert/strict";
import fs from "node:fs";
import { calculateUnifiedImportSimulation } from "../lib/unified-import-simulation.ts";
import { runImportSimulationV2 } from "../lib/simulation-v2.ts";

const item = { itemId: "ITEM-001", name: "Verniz", ncm: "32081020", origin: "México", quantity: 10, weightKg: 100, fobUnit: 20, icms: 12, ttd: "none", destination: "commercial_resale" };
const base = { date: "2026-09-10", exchange: 5.5, freight: 100, insurance: 10, transportMode: "air", declarationType: "di", items: [item] };

const sc = calculateUnifiedImportSimulation({ ...base, destinationUf: "SC" });
assert.equal(sc.jurisdiction.stateEngine, "SC");
assert.deepEqual(sc.jurisdiction.homologatedUfs, ["ES", "SC", "SP"]);
const sp = calculateUnifiedImportSimulation({ ...base, destinationUf: "SP" });
assert.equal(sp.jurisdiction.stateEngine, "GENERAL");
assert.equal(sp.calculation.items[0].icmsNormalRate, 18);
const es = calculateUnifiedImportSimulation({ ...base, destinationUf: "ES" });
assert.equal(es.jurisdiction.stateEngine, "GENERAL");
assert.equal(es.jurisdiction.scope, "general_rate_only");
assert.equal(es.calculation.items[0].icmsNormalRate, 17);
assert.equal(es.calculation.items[0].icmsImportEffectiveRate, 17);
assert.equal(es.calculation.items[0].importICMSSavings, 0);

for (const uf of ["PE", "PR", "RO", "MG", "MS", "RJ"]) assert.throws(() => calculateUnifiedImportSimulation({ ...base, destinationUf: uf }), new RegExp(`UF ${uf} não homologada`, "i"));
for (const uf of ["SP", "ES"]) assert.throws(() => calculateUnifiedImportSimulation({ ...base, destinationUf: uf, items: [{ ...item, ttd: "409" }] }), /apenas para a regra geral de ICMS/i);
assert.throws(() => calculateUnifiedImportSimulation({ ...base, destinationUf: "Espírito Santo" }), /UF válida com 2 letras/i);

for (const uf of ["SC", "SP", "ES"]) {
  const v2 = runImportSimulationV2({ ...base, destinationUf: uf, scenarioName: `${uf} homologada`, targetMarginPercent: 20 });
  assert.equal(v2.jurisdiction?.destinationUf, uf);
  assert(v2.summary?.landedCostBrl > 0);
  assert.notEqual(v2.status, "blocked");
}
const v2Pe = runImportSimulationV2({ ...base, destinationUf: "PE", scenarioName: "PE fora do escopo", targetMarginPercent: 20 });
assert.equal(v2Pe.status, "blocked");
assert.equal(v2Pe.summary, null);
assert(v2Pe.issues.some((issue) => issue.code === "state_jurisdiction_unsupported"));

const route = fs.readFileSync("app/api/sc-federal-calculate/route.ts", "utf8");
assert.match(route, /destinationUf/);
assert.match(route, /body\.uf/);
console.log("State jurisdiction scope: OK — SC full, SP and ES general-rate-only, remaining UFs fail closed");
