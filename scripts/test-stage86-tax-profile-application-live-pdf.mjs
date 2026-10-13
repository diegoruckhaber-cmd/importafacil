import assert from "node:assert/strict";
import fs from "node:fs";
import { analyzeImportTaxCredits2026 } from "../lib/tax-profile.ts";
import { buildSimulationReportPdf } from "../lib/simulation-report-pdf.ts";
import { PDFDocument } from "pdf-lib";

const taxes = { icms: 20000, ipi: 2500, pisImport: 1300, cofinsImport: 6000 };

const realResale = analyzeImportTaxCredits2026({
  date: "2026-11-01",
  regime: "lucro-real",
  application: "commercial_resale",
  icmsTaxpayer: true,
  taxes,
});
assert.equal(realResale.totalRecoverableCredits, 29800);
assert.equal(realResale.icmsCredit, 20000);
assert.equal(realResale.ipiCredit, 2500);
assert.equal(realResale.pisImportCredit, 1300);
assert.equal(realResale.cofinsImportCredit, 6000);

const presumed = analyzeImportTaxCredits2026({
  date: "2026-11-01",
  regime: "lucro-presumido",
  application: "commercial_resale",
  icmsTaxpayer: true,
  taxes,
});
assert.equal(presumed.totalRecoverableCredits, 22500);
assert.equal(presumed.pisImportCredit, 0);
assert.equal(presumed.cofinsImportCredit, 0);

const simples = analyzeImportTaxCredits2026({
  date: "2026-11-01",
  regime: "simples-nacional",
  application: "commercial_resale",
  icmsTaxpayer: true,
  taxes,
});
assert.equal(simples.totalRecoverableCredits, 0);

const useConsumption = analyzeImportTaxCredits2026({
  date: "2026-11-01",
  regime: "lucro-real",
  application: "use_consumption",
  icmsTaxpayer: true,
  taxes,
});
assert.equal(useConsumption.totalRecoverableCredits, 0);
assert.ok(useConsumption.warnings.some((x) => x.includes("2033")));

const simulator = fs.readFileSync("app/simulacao-v2/page.tsx", "utf8");
assert.match(simulator, /Regime tributário da empresa/);
assert.match(simulator, /Lucro Real/);
assert.match(simulator, /Lucro Presumido/);
assert.match(simulator, /Simples Nacional/);
assert.match(simulator, /Aplicação da mercadoria/);
assert.match(simulator, /Uso e consumo/);
assert.match(simulator, /ItemPreflightAlerts/);
assert.match(simulator, /Baixar PDF personalizado/);
assert.doesNotMatch(simulator, /onClick=\{\(\) => window\.print\(\)\}>Imprimir \/ Salvar PDF/);

const preflight = fs.readFileSync("app/api/item-preflight/route.ts", "utf8");
assert.match(preflight, /Possível preferência Mercosul-UE/);
assert.match(preflight, /Defesa comercial identificada/);
assert.match(preflight, /Tratamento de II exige confirmação/);

const report = fs.readFileSync("lib/simulation-report-pdf.ts", "utf8");
assert.match(report, /SIMULAÇÃO DE IMPORTAÇÃO/);
assert.match(report, /Desembolso bruto estimado/);
assert.match(report, /Custo econômico líquido/);
assert.match(report, /Pontos de atenção/);

console.log("Stage 86 tax profile, application, live preflight and PDF contract passed.");


const pdfBytes = await buildSimulationReportPdf({
  name: "Teste PDF ImportaFácil",
  created_at: "2026-10-11T20:00:00-03:00",
  input: {
    scenarioName: "Teste PDF ImportaFácil",
    date: "2026-11-01",
    destinationUf: "RR",
    companyTaxRegime: "lucro-real",
    exchange: 5,
    items: [{ itemId: "ITEM-001", destination: "commercial_resale" }],
  },
  result: {
    status: "alert",
    operation: { destinationUf: "RR", companyTaxRegime: "lucro-real", exchange: 5 },
    summary: {
      merchandiseBrl: 50000,
      freightBrl: 12500,
      insuranceBrl: 500,
      iiBrl: 7938,
      ipiBrl: 2305.49,
      pisImportBrl: 1323,
      cofinsImportBrl: 6079.5,
      icmsImportBrl: 20465.12,
      afrmmBrl: 1000,
      siscomexBrl: 214.5,
      storageBrl: 3500,
      otherExpensesBrl: 5000,
      defenseCommercialBrl: 0,
      grossDisbursementBrl: 110825.61,
      landedCostBrl: 110825.61,
      recoverableTaxCreditsBrl: 30173.11,
      economicNetCostBrl: 80652.5,
      icmsCreditBrl: 20465.12,
      ipiCreditBrl: 2305.49,
      pisImportCreditBrl: 1323,
      cofinsImportCreditBrl: 6079.5,
      targetRevenueBrl: 80652.5,
    },
    items: [{
      itemId: "ITEM-001",
      name: "Tinta",
      ncm: "32081010",
      federal: { ii: { rate: 12.6 }, ipi: { rate: 3.25 } },
      creditAnalysis: { application: "commercial_resale", totalRecoverableCredits: 30173.11 },
      commercial: { breakEvenPricePerUnitBrl: 80.65 },
    }],
    attentionPoints: ["Origem na União Europeia detectada; validar preferência e prova de origem."],
  },
});
assert.ok(pdfBytes.length > 1000);
const parsedPdf = await PDFDocument.load(pdfBytes);
assert.ok(parsedPdf.getPageCount() >= 1);
