import { calculateTTD409410 } from "../lib/sc-ttd409-410-calculation.ts";

const result = calculateTTD409410({
  normalImportICMS: 26100,
  normalOutputICMS: 20000,
  importDeferred: true,
  outputCreditPresumed: true,
  presumedCreditAmount: 12000,
});

if (result.status !== "calculated") throw new Error("Resultado deveria ser calculado");
if (result.importICMSCash !== 0) throw new Error("Importação diferida deveria ter ICMS caixa zero");
if (result.outputICMSCash !== 8000) throw new Error("Crédito presumido não aplicado corretamente");
if (result.totalICMSCash !== 8000) throw new Error("Total ICMS incorreto");
if (result.estimatedSavings !== 38100) throw new Error("Economia incorreta");

const conditional = calculateTTD409410({
  normalImportICMS: 26100,
  normalOutputICMS: 20000,
  importDeferred: true,
  outputCreditPresumed: true,
});

if (conditional.status !== "conditional") throw new Error("Cenário sem valor do crédito deveria ser condicional");

console.log("TTD 409/410 calculation bridge: PASS");
