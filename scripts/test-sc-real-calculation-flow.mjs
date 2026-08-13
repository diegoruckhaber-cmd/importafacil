import { calculateSCRealOperation } from "../lib/sc-real-calculation-flow.ts";

const base = {
  quantity: 1000,
  unitFobUsd: 10,
  exchangeRate: 5,
  freightUsd: 2000,
  insuranceUsd: 500,
  iiRate: 10,
  ipiRate: 5,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsRate: 17,
  icmsTaxableAdditionsBrl: 0,
  otherBrl: 0,
  ttd: 410,
  destination: "commercial_resale",
  operation: "internal",
  validConcession: true,
  importEntryInSC: true,
  decree2128Prohibited: false,
  sameNcmPositionAfterFractionation: true,
  outputValue: 100000,
  outputICMSRate: 17,
  regimeHolderMonths: 36,
};

const result = calculateSCRealOperation(base);

if (result.status !== "calculated") throw new Error(JSON.stringify(result));
if (!result.benefit || result.benefit.targetOutputICMS <= 0) throw new Error("Benefício não calculado");
if (result.warnings.length !== 0) throw new Error("Resultado calculado com warning inesperado");
if (result.importCalculation.taxes.icms.payable <= 0) throw new Error("ICMS de importação não calculado");

const blocked = calculateSCRealOperation({ ...base, validConcession: false });
if (blocked.status !== "denied" || blocked.benefit !== null) throw new Error("Bloqueio de concessão inválido");

const conditional = calculateSCRealOperation({ ...base, regimeHolderMonths: 0 });
if (conditional.status !== "calculated") throw new Error("Fluxo inicial do TTD deveria continuar calculável");
if (!conditional.benefit || conditional.benefit.targetTaxLoadPercent !== 2.6) {
  throw new Error("Carga inicial de 2,6% não resolvida corretamente");
}

console.log("SC real calculation flow: PASS");
