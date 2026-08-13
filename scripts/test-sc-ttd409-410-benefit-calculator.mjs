import { calculateTTD409410Benefit } from "../lib/sc-ttd409-410-benefit-calculator.ts";

const result = calculateTTD409410Benefit({
  destination: "commercial_resale",
  operation: "internal",
  aliquotaPercent: 17,
  productClass: "other",
  continuousTTDMonths: 48,
  outputTaxBase: 100000,
});

if (result.status !== "calculated") throw new Error(JSON.stringify(result));
if (result.targetOutputICMS !== 1000) throw new Error(`ICMS alvo inesperado: ${result.targetOutputICMS}`);
if (Math.abs(result.presumedCreditAmount - 16000) > 1e-9) throw new Error(`Crédito inesperado: ${result.presumedCreditAmount}`);
if (Math.abs(result.presumedCreditPercentOfOutputICMS - 94.11764705882354) > 1e-9) throw new Error(`Percentual inesperado: ${result.presumedCreditPercentOfOutputICMS}`);

console.log("TTD 409/410 benefit calculator: PASS");
