import { compareImportScenario } from "../lib/import-scenario-comparator.ts";

const base = {
  ncm: "32081020", quantity: 10, fobUnitUsd: 100, exchangeRate: 5, freightUsd: 50, insuranceUsd: 10,
  otherExpensesBrl: 100, iiRate: 0.14, ipiRate: 0.035, pisImportRate: 0.021, cofinsImportRate: 0.0965, icmsRate: 0.17,
  saleOriginUf: "SC", saleDestinationUf: "SC", saleType: "internal",
};

const real = compareImportScenario({ ...base, taxProfile: { regime: "lucro-real", destinationUf: "SC", icmsRate: 0.17, icmsCreditTreatment: "integral", pisCofinsCreditable: true, includeIpiInIcmsBase: true } }, "normal");
const simples = compareImportScenario({ ...base, taxProfile: { regime: "simples-nacional", destinationUf: "SC", icmsRate: 0.17, icmsCreditTreatment: "nao-creditavel", pisCofinsCreditable: false, includeIpiInIcmsBase: true } }, "normal");

if (real.taxProfile?.regime !== "lucro-real") throw new Error("Lucro Real não propagado.");
if (simples.taxProfile?.regime !== "simples-nacional") throw new Error("Simples Nacional não propagado.");
if (real.saleContext.type !== "internal") throw new Error("Venda interna não identificada.");
if (real.saleContext.outputTaxStatus !== "requires-validation") throw new Error("Saída deveria exigir validação sem alíquota informada.");
if (real.creditAnalysis?.icmsCredit !== real.engineResult.items[0].normalImportICMS) throw new Error("Crédito integral de ICMS não refletido no perfil.");
if (simples.creditAnalysis?.icmsCredit !== 0) throw new Error("Simples Nacional não deveria presumir crédito integral de ICMS.");
if (real.engineResult.items[0].normalImportICMS !== simples.engineResult.items[0].normalImportICMS) throw new Error("Regime tributário não deve alterar indevidamente o tributo devido na importação.");

const interstate = compareImportScenario({ ...base, saleType: "interstate", saleOriginUf: "SC", saleDestinationUf: "PR", taxProfile: { regime: "lucro-presumido", destinationUf: "PR", icmsRate: 0.12, icmsCreditTreatment: "a-validar", pisCofinsCreditable: "parcial", includeIpiInIcmsBase: "a-validar" } }, "normal");
if (interstate.saleContext.type !== "interstate" || interstate.saleContext.destinationUf !== "PR") throw new Error("Venda interestadual não identificada.");

console.log("OK: perfil tributário e contexto de venda integrados sem alterar indevidamente a tributação da importação.");
