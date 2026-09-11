import assert from "node:assert/strict";
import fs from "node:fs";
import { compareSavedSimulationV2, savedSimulationKind, savedSimulationTotal } from "../lib/simulation-record.ts";

const make = (id, cost, revenue, profit, status = "calculated") => ({
  id,
  name: `Cenário ${id}`,
  created_at: `2026-09-${id === "A" ? "10" : "11"}T12:00:00Z`,
  input: { scenarioName: `Cenário ${id}`, items: [{ itemId: "I1" }] },
  result: {
    contract: "importafacil-simulation-v2",
    engine: "unified-multi-item-v1",
    status,
    summary: {
      merchandiseBrl: 100000,
      customsValueBrl: 110000,
      importTaxesBrl: 20000,
      defenseCommercialBrl: 0,
      icmsImportSavingsBrl: 5000,
      landedCostBrl: cost,
      targetRevenueBrl: revenue,
      estimatedProfitBrl: profit,
    },
    items: [{ itemId: "I1", quantity: 100 }],
  },
});

const a = make("A", 150000, 190000, 40000);
const b = make("B", 145000, 185000, 40000, "alert");
assert.equal(savedSimulationKind(a), "v2");
assert.equal(savedSimulationTotal(a), 150000);
const compared = compareSavedSimulationV2([a, b]);
assert.equal(compared.length, 2);
assert.equal(compared[0].id, "B", "comparison must rank by landed cost without recalculation");
assert.equal(compared[0].status, "alert");
assert.equal(compared[0].estimatedProfitBrl, 40000);

const legacy = { id:"L", name:"legacy", created_at:"2026-01-01", input:{quantity:1}, result:{total:99} };
assert.equal(savedSimulationKind(legacy), "legacy");
assert.equal(savedSimulationTotal(legacy), 99);
assert.throws(() => compareSavedSimulationV2([a, legacy]), /pelo menos duas/);

const api = fs.readFileSync("app/api/simulations/route.ts", "utf8");
const v2Page = fs.readFileSync("app/simulacao-v2/page.tsx", "utf8");
const dashboard = fs.readFileSync("app/dashboard/page.tsx", "utf8");
const detail = fs.readFileSync("app/simulacao/[id]/page.tsx", "utf8");
const report = fs.readFileSync("app/relatorio/page.tsx", "utf8");
const compare = fs.readFileSync("app/comparar/page.tsx", "utf8");

assert.match(api, /body\.mode === "v2"/);
assert.match(api, /importafacil-simulation-v2/);
assert.match(v2Page, /Salvar no histórico/);
assert.match(v2Page, /mode:"v2"/);
assert.match(dashboard, /savedSimulationKind/);
assert.match(detail, /V2Result/);
assert.match(report, /Nenhuma alíquota ou benefício é recalculado/);
assert.match(compare, /compareSavedSimulationV2/);
assert.doesNotMatch(report, /calculateUnifiedImportSimulation|resolveFederalTaxes|calculator/);
assert.doesNotMatch(compare, /calculateUnifiedImportSimulation|resolveFederalTaxes|\/api\/import-scenario-compare/);

console.log("Stage 4 acceptance: OK — V2 persistence, history, report and saved-scenario comparator locked");
