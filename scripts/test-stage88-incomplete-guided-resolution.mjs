import assert from "node:assert/strict";
import fs from "node:fs";
import { resolveFederalTaxes } from "../lib/federal-tax-resolution.ts";
import { runImportSimulationV2 } from "../lib/simulation-v2.ts";
import { executeOfficialSimulationV2 } from "../lib/server-simulation-v2.ts";

const unresolvedVehicle = resolveFederalTaxes({ ncm: "87032310", date: "2026-10-12" });
assert.equal(unresolvedVehicle.ipi.status, "requires_input");
assert.ok(unresolvedVehicle.ipi.candidates.some((candidate) => candidate.exCode));

const baseVehicle = resolveFederalTaxes({ ncm: "87032310", date: "2026-10-12", ipiBaseConfirmed: true });
assert.equal(baseVehicle.ipi.status, "resolved");
assert.ok(baseVehicle.ipi.rate != null);

const input = {
  scenarioName: "Teste parcial",
  date: "2026-10-12",
  destinationUf: "SC",
  exchange: 5.5,
  freight: 5000,
  insurance: 300,
  storage: 4000,
  otherBrl: 5000,
  transportMode: "maritime_long_course",
  declarationType: "duimp",
  targetMarginPercent: 20,
  companyTaxRegime: "lucro-real",
  icmsTaxpayer: true,
  items: [
    {
      itemId: "ITEM-001",
      name: "n-Butanol",
      ncm: "29051300",
      origin: "Estados Unidos",
      quantity: 10000,
      fobUnit: 1.2,
      weightKg: 10000,
      volumeM3: 15,
      icms: 17,
      exporter: "Basf Corporation",
      destination: "industrialization",
      targetMarginPercent: 20,
      ttd: "none",
    },
    {
      itemId: "ITEM-002",
      name: "Automóvel de passageiros 2.0 a gasolina",
      ncm: "87032310",
      origin: "Alemanha",
      quantity: 1,
      fobUnit: 30000,
      weightKg: 1550,
      volumeM3: 12,
      icms: 17,
      destination: "use_consumption",
      targetMarginPercent: 20,
      ttd: "none",
    },
  ],
};

const partial = runImportSimulationV2(input);
assert.equal(partial.status, "requires_input");
assert.equal(partial.summary, null);
assert.equal(partial.completion.totalItems, 2);
assert.equal(partial.completion.pendingItems, 1);
assert.ok(partial.completion.completedItems >= 1);
const item1 = partial.items.find((item) => item.itemId === "ITEM-001");
const item2 = partial.items.find((item) => item.itemId === "ITEM-002");
assert.equal(item1?.partial, true);
assert.ok(item1?.commercial?.breakEvenPricePerUnitBrl > 0);
assert.equal(item2?.commercial, null);

const official = executeOfficialSimulationV2(input);
assert.ok(Array.isArray(official.legalTrace));
assert.ok(!official.attentionPoints.some((point) => /\bresolved\b|Fundamento:/i.test(String(point))));

const page = fs.readFileSync("app/simulacao-v2/page.tsx", "utf8");
assert.match(page, /Resolver esta pendência/);
assert.match(page, /PDF disponível após concluir/);
assert.match(page, /Resultado parcial e pendências/);
assert.match(page, /Preferência Mercosul-UE identificada/);
assert.match(page, /timeout\(10000/);\nassert.match(page, /timeout\(5000/);

const preflight = fs.readFileSync("app/components/ItemPreflightAlerts.tsx", "utf8");
assert.match(preflight, /Resolver agora/);

const ipiSelector = fs.readFileSync("app/components/FederalIpiTreatmentSelector.tsx", "utf8");
assert.match(ipiSelector, /Regra geral da NCM/);
assert.match(ipiSelector, /EX /);
assert.equal(ipiSelector.includes(String.fromCharCode(92, 96)), false);

const pdf = fs.readFileSync("lib/simulation-report-pdf.ts", "utf8");
assert.match(pdf, /CONCLUÍDO COM ALERTAS/);
assert.match(pdf, /PDF executivo só pode ser gerado após a conclusão/);
assert.match(pdf, /itemNameLines/);

const persistence = fs.readFileSync("lib/server-simulation-persistence.ts", "utf8");
assert.match(persistence, /8000/);
assert.match(persistence, /Tempo limite excedido/);

console.log("Stage 88 incomplete-flow guided resolution regression passed.");
