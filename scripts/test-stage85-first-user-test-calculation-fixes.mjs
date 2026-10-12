import assert from "node:assert/strict";
import { runImportSimulationV2 } from "../lib/simulation-v2.ts";

const base = {
  scenarioName:"Teste RR",
  date:"2026-11-01",
  destinationUf:"RR",
  exchange:5,
  freight:2000,
  insurance:100,
  storage:3500,
  otherBrl:5000,
  transportMode:"maritime_long_course",
  declarationType:"di",
  targetMarginPercent:0,
  items:[{
    itemId:"ITEM-001",
    name:"Tinta",
    ncm:"32081010",
    origin:"Alemanha",
    quantity:1000,
    fobUnit:10,
    weightKg:1000,
    volumeM3:0,
    icms:17,
    ttd:"none",
    destination:"commercial_resale",
    targetMarginPercent:0,
  }]
};

const normal = runImportSimulationV2(base);
assert.ok(normal.summary);
assert.equal(normal.summary.freightBrl,10000);
assert.equal(normal.summary.insuranceBrl,500);
assert.equal(normal.summary.afrmmBrl,800);
assert.equal(normal.summary.siscomexBrl,214.5);
assert.equal(normal.summary.storageBrl,3500);
assert.equal(normal.summary.otherExpensesBrl,5000);
assert.equal(normal.summary.grossDisbursementBrl,normal.summary.landedCostBrl);
assert.equal(normal.summary.economicNetCostBrl,null);
assert.equal(normal.summary.economicCostStatus,"requires_tax_profile_validation");
assert.equal(normal.items[0].federal.ii.rate,12.6);
assert.ok(normal.attentionPoints.some(x=>x.includes("União Europeia")));

const preferred = runImportSimulationV2({
  ...base,
  items:[{
    ...base.items[0],
    mercosurEuPreferenceRequested:true,
    mercosurEuOriginProofConfirmed:true,
    mercosurEuPreferentialIiRate:11.3,
    mercosurEuQuotaRequired:false,
  }]
});
assert.ok(preferred.summary);
assert.equal(preferred.items[0].federal.ii.rate,11.3);
assert.ok(preferred.summary.iiBrl < normal.summary.iiBrl);
assert.ok(preferred.summary.grossDisbursementBrl < normal.summary.grossDisbursementBrl);

const page = await import("node:fs").then(m=>m.readFileSync("app/simulacao-v2/page.tsx","utf8"));
assert.match(page,/Desembolso bruto da importação/);
assert.match(page,/Custo econômico líquido/);
assert.match(page,/AFRMM/);
assert.match(page,/Taxa Siscomex/);
assert.match(page,/PIS-Importação/);
assert.match(page,/Cofins-Importação/);
assert.match(page,/Preferência Mercosul-UE/);

console.log("First user-test calculation corrections passed.");
