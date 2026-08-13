import { calculateSCRealOperation } from "../lib/sc-real-calculation-flow.ts";

const base = {
  quantity: 1000,
  fobPerUnit: 10,
  exchangeRate: 5,
  freight: 2000,
  insurance: 500,
  iiRate: 0.1,
  ipiRate: 0.05,
  pisRate: 0.021,
  cofinsRate: 0.0965,
  icmsRate: 0.17,
  taxableAdditions: 0,
  nonTaxableOperatingExpenses: 0,
  ttd: 410,
  destination: "commercial_resale",
  validConcession: true,
  importEntryInSC: true,
  decree2128Prohibited: false,
  sameNcmPositionAfterFractionation: true,
  outputValue: 100000,
  outputICMSRate: 0.17,
  regimeHolderMonths: 36,
};

const result = calculateSCRealOperation(base);

if (result.status !== "calculated") throw new Error(JSON.stringify(result));
if (!result.benefit || result.benefit.effectiveICMS <= 0) throw new Error("Benefício não calculado");
if (result.warnings.length !== 0) throw new Error("Resultado calculado com warning inesperado");

const blocked = calculateSCRealOperation({ ...base, validConcession: false });
if (blocked.status !== "denied" || blocked.benefit !== null) throw new Error("Bloqueio de concessão inválido");

console.log("SC real calculation flow: PASS");
