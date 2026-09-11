import assert from "node:assert/strict";
import fs from "node:fs";
import { runImportSimulationV2 } from "../lib/simulation-v2.ts";

const base = {
  scenarioName: "Stage 3 acceptance",
  date: "2026-09-10",
  exchange: 5.5,
  freight: 1000,
  insurance: 100,
  storage: 2500,
  otherBrl: 500,
  transportMode: "air",
  declarationType: "di",
  targetMarginPercent: 20,
};

const calculated = runImportSimulationV2({
  ...base,
  items: [
    {
      itemId: "ITEM-001",
      name: "Verniz A",
      ncm: "32081020",
      origin: "México",
      quantity: 100,
      fobUnit: 20,
      weightKg: 150,
      icms: 17,
      ttd: "none",
      destination: "commercial_resale",
      targetMarginPercent: 20,
    },
    {
      itemId: "ITEM-002",
      name: "Verniz B",
      ncm: "32081020",
      origin: "México",
      quantity: 50,
      fobUnit: 30,
      weightKg: 90,
      icms: 17,
      ttd: "none",
      destination: "commercial_resale",
      targetMarginPercent: 25,
    },
  ],
});

assert.equal(calculated.contract, "importafacil-simulation-v2");
assert.equal(calculated.engine, "unified-multi-item-v1");
assert.equal(calculated.federalEngine, "authoritative-federal-v2");
assert.equal(calculated.items.length, 2);
assert(calculated.summary, "resolved operation must expose the commercial summary");
assert(calculated.summary.landedCostBrl > 0);
assert(calculated.summary.capitalRequiredBrl === calculated.summary.landedCostBrl);
assert(calculated.summary.targetRevenueBrl > calculated.summary.landedCostBrl);
assert(calculated.summary.estimatedProfitBrl > 0);
assert(["calculated", "alert"].includes(calculated.status), `unexpected resolved status: ${calculated.status}`);

for (const item of calculated.items) {
  assert(item.calculation?.landedCostIncludingDefense > 0);
  assert(item.commercial?.breakEvenPricePerUnitBrl > 0);
  assert(item.commercial?.targetSalePricePerUnitBrl > item.commercial?.breakEvenPricePerUnitBrl);
  assert(item.commercial?.estimatedProfitBrl > 0);
  const expected = item.commercial.breakEvenPricePerUnitBrl / (1 - item.commercial.targetMarginPercent / 100);
  assert(Math.abs(item.commercial.targetSalePricePerUnitBrl - expected) < 1e-9);
}

const unsupported = runImportSimulationV2({
  ...base,
  items: [{
    itemId: "ITEM-X",
    name: "NCM fora do catálogo",
    ncm: "99999999",
    origin: "México",
    quantity: 1,
    fobUnit: 100,
    icms: 17,
    ttd: "none",
    destination: "commercial_resale",
  }],
});
assert.equal(unsupported.status, "unsupported");
assert.equal(unsupported.summary, null);
assert.equal(unsupported.calculation, null);
assert(unsupported.issues.some((issue) => issue.code === "federal_unsupported"));

assert.throws(() => runImportSimulationV2({
  ...base,
  targetMarginPercent: 100,
  items: [{
    itemId: "ITEM-M",
    ncm: "32081020",
    origin: "México",
    quantity: 1,
    fobUnit: 100,
    icms: 17,
    ttd: "none",
    destination: "commercial_resale",
  }],
}), /Margem alvo/);

const service = fs.readFileSync("lib/simulation-v2.ts", "utf8");
const route = fs.readFileSync("app/api/simulation-v2/route.ts", "utf8");
const persistenceRoute = fs.readFileSync("app/api/simulations/route.ts", "utf8");
const page = fs.readFileSync("app/simulacao-v2/page.tsx", "utf8");
assert.match(service, /calculateUnifiedImportSimulation/);
assert.match(service, /resolveFederalTaxes/);
assert.doesNotMatch(service, /from ["']\.\/calculator/);
assert.match(route, /runImportSimulationV2/);
assert.match(page, /\/api\/simulation-v2/);
assert.match(page, /\/api\/simulations/);
assert.match(page, /mode:"v2"/);
assert.doesNotMatch(page, /lib\/calculator/);
assert.match(persistenceRoute, /body\.mode === "v2"/);
assert.match(persistenceRoute, /body\.result\.contract !== "importafacil-simulation-v2"/);

console.log("Simulation V2 acceptance: OK — multi-item, explicit status, commercial layer, canonical engine and snapshot persistence locked");
