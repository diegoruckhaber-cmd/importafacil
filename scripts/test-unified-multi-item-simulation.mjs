import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { calculateUnifiedImportSimulation } from "../lib/unified-import-simulation.ts";

const result = calculateUnifiedImportSimulation({
  date: "2026-09-10",
  exchange: 5,
  freight: 1000,
  insurance: 100,
  storage: 1000,
  otherBrl: 0,
  transportMode: "maritime_long_course",
  declarationType: "di",
  additions: 2,
  items: [
    {
      itemId: "ITEM-A",
      name: "Produto A",
      ncm: "40112090",
      origin: "México",
      quantity: 100,
      weightKg: 500,
      volumeM3: 1,
      fobUnit: 10,
      icms: 17,
      ttd: "none",
      destination: "commercial_resale",
      // Deliberately ignored extra legacy/manual fields: the unified engine resolves federal rates itself.
      iiRate: 99,
      ipiRate: 99,
    },
    {
      itemId: "ITEM-B",
      name: "Produto B",
      ncm: "40112090",
      origin: "México",
      quantity: 100,
      weightKg: 1000,
      volumeM3: 2,
      fobUnit: 20,
      icms: 17,
      ttd: "none",
      destination: "commercial_resale",
    },
  ],
});

assert.equal(result.engine, "unified-multi-item-v1");
assert.equal(result.items.length, 2);
assert.equal(result.operation.itemCount, 2);
assert.equal(result.calculation.items.length, 2);
assert.ok(Math.abs(result.calculation.totalCustomsValue - 20500) < 0.01, "frete e seguro devem entrar no valor aduaneiro e ser rateados por valor do item");
assert.ok(Math.abs(result.calculation.totalAllocatedExpenses - 7144) < 0.01, "despesas compartilhadas devem ser rateadas integralmente entre os itens");
assert.equal(result.items[0].federal.ii.automatic, true);
assert.equal(result.items[0].federal.ipi.automatic, true);
assert.equal(result.items[0].federal.pisImport.automatic, true);
assert.equal(result.items[0].federal.cofinsImport.automatic, true);
assert.notEqual(result.items[0].federal.ii.rate, 99, "alíquota manual legada de II não pode substituir a resolução automática");
assert.notEqual(result.items[0].federal.ipi.rate, 99, "alíquota manual legada de IPI não pode substituir a resolução automática");
assert.equal(result.calculation.totalLandedCostIncludingDefense >= result.calculation.totalLandedCostAfterBenefit, true);

const rootPage = fs.readFileSync(path.join(process.cwd(), "app", "page.tsx"), "utf8");
const operationPage = fs.readFileSync(path.join(process.cwd(), "app", "sc-operation", "page.tsx"), "utf8");
const dashboardPage = fs.readFileSync(path.join(process.cwd(), "app", "dashboard", "page.tsx"), "utf8");

assert.ok(rootPage.includes('fetch("/api/sc-federal-calculate"'), "a home deve usar o backend unificado");
assert.ok(operationPage.includes('fetch("/api/sc-federal-calculate"'), "a tela multi-item deve usar o mesmo backend da home");
assert.ok(dashboardPage.includes('href="/sc-operation"'), "Nova simulação do dashboard deve abrir o fluxo multi-item unificado");
assert.equal(operationPage.includes("calculateSCMultiItemFinalCost"), false, "a tela não deve mais calcular tributos localmente");
assert.equal(operationPage.includes("resolveSCBenefit"), false, "a tela não deve mais resolver benefício fiscal localmente");
assert.equal(operationPage.includes("iiRate"), false, "a tela multi-item não deve expor alíquota federal manual");
assert.equal(operationPage.includes("ipiRate"), false, "a tela multi-item não deve expor alíquota federal manual");

console.log("unified automatic multi-item simulation: OK");
