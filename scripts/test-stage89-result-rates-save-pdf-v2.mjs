import assert from "node:assert/strict";
import fs from "node:fs";
import { PDFDocument } from "pdf-lib";
import { buildSimulationReportPdf } from "../lib/simulation-report-pdf.ts";

const page = fs.readFileSync("app/simulacao-v2/page.tsx", "utf8");
const exporter = fs.readFileSync("app/components/DefenseCommercialExporterSelector.tsx", "utf8");

assert.match(page, /Marítimo - longo curso/);
assert.doesNotMatch(page, /Marítimo — longo curso/);
assert.match(page, /PIS-Imp\./);
assert.match(page, /Cofins-Imp\./);
assert.match(page, /Defesa comercial/);
assert.match(page, /sameRateLabel/);
assert.match(page, /taxLineRatePct/);
assert.match(page, /timeout\(5000/);
assert.match(page, /cachedSupabaseAccessToken/);
assert.match(page, /sb-fagjbhhmbpdsmoyjcood-auth-token/);
assert.match(page, /timeout\(10000/);
assert.match(page, /response\.text\(\)/);
assert.match(page, /Você pode tentar novamente sem recarregar a página/);
assert.doesNotMatch(exporter, / — /);

const pdfBytes = await buildSimulationReportPdf({
  name: "Teste completo - Dumping + Mercosul UE",
  created_at: "2026-10-12T20:58:00-03:00",
  input: {
    scenarioName: "Teste completo - Dumping + Mercosul UE",
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
    items: [
      { itemId:"ITEM-001", name:"n-Butanol", ncm:"29051300", origin:"Estados Unidos", quantity:10000, fobUnit:1.2, weightKg:10000, destination:"industrialization" },
      { itemId:"ITEM-002", name:"Automóvel de passageiros 2.0 a gasolina", ncm:"87032310", origin:"Alemanha", quantity:1, fobUnit:30000, weightKg:1550, destination:"use_consumption" },
    ],
  },
  result: {
    status:"alert",
    operation:{ destinationUf:"SC", companyTaxRegime:"lucro-real", exchange:5.5 },
    summary:{
      merchandiseBrl:231000,
      freightBrl:27500,
      insuranceBrl:1650,
      customsValueBrl:260150,
      iiBrl:39477.43,
      ipiBrl:37544.03,
      pisImportBrl:5463.15,
      cofinsImportBrl:25104.48,
      icmsImportBrl:75820.63,
      defenseCommercialBrl:22299.40,
      siscomexBrl:244,
      afrmmBrl:2200,
      storageBrl:4000,
      otherExpensesBrl:5000,
      grossDisbursementBrl:477303.11,
      landedCostBrl:477303.11,
      recoverableTaxCreditsBrl:33412.10,
      economicNetCostBrl:443891.01,
      ipiCreditBrl:0,
      icmsCreditBrl:22804.09,
      pisImportCreditBrl:1895.90,
      cofinsImportCreditBrl:8712.11,
    },
    items:[
      {
        itemId:"ITEM-001",name:"n-Butanol",ncm:"29051300",origin:"Estados Unidos",quantity:10000,
        federal:{ii:{rate:12.6},ipi:{rate:3.25},defenseCommercial:{rate:24.7,unit:"AD_VALOREM"}},
        state:{icmsGeneralRate:17},
        calculation:{taxLines:{pisImport:{rate:0.021},cofinsImport:{rate:0.0965,displayRate:9.65},icms:{rate:0.17}}},
        creditAnalysis:{application:"industrialization"},
        commercial:{breakEvenPricePerUnitBrl:20.5},
      },
      {
        itemId:"ITEM-002",name:"Automóvel de passageiros 2.0 a gasolina",ncm:"87032310",origin:"Alemanha",quantity:1,
        federal:{ii:{rate:17.5},ipi:{rate:25},defenseCommercial:{},mercosurEuPreference:{appliedPreference:true}},
        state:{icmsGeneralRate:17},
        calculation:{taxLines:{pisImport:{rate:0.021},cofinsImport:{rate:0.0965,displayRate:9.65},icms:{rate:0.17}}},
        creditAnalysis:{application:"use_consumption"},
        commercial:{breakEvenPricePerUnitBrl:238000},
      },
    ],
    attentionPoints:["Direito de defesa comercial resolvido para o produtor/exportador selecionado."],
    legalTrace:[{itemId:"ITEM-001",tax:"II",status:"resolved",legalBasis:"MDIC"}],
  },
});
assert.ok(pdfBytes.length > 3000);
const parsed = await PDFDocument.load(pdfBytes);
assert.ok(parsed.getPageCount() >= 1);

const pdfSource = fs.readFileSync("lib/simulation-report-pdf.ts","utf8");
assert.match(pdfSource, /PRINCIPAIS VALORES|Principais valores/);
assert.match(pdfSource, /Resumo financeiro/);
assert.match(pdfSource, /CRÉDITOS RECUPERÁVEIS ESTIMADOS/);
assert.match(pdfSource, /FECHAMENTO DA OPERAÇÃO/);
assert.match(pdfSource, /SIMULAÇÃO DE IMPORTAÇÃO/);
assert.match(pdfSource, /Valor aduaneiro/);

console.log("Stage 89 result rates, save timeout and detailed PDF regression passed.");
