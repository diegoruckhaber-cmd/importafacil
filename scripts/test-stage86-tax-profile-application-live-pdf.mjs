import assert from "node:assert/strict";
import fs from "node:fs";
import { analyzeImportTaxCredits2026 } from "../lib/tax-profile.ts";

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
assert.match(report, /RELATÓRIO EXECUTIVO DE IMPORTAÇÃO/);
assert.match(report, /Desembolso bruto estimado/);
assert.match(report, /Custo econômico líquido/);
assert.match(report, /Pontos de atenção/);

console.log("Stage 86 tax profile, application, live preflight and PDF contract passed.");
