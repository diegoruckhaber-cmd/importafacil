import { resolveTTD409410OutputRate } from "../lib/sc-ttd409-410-output-rate.ts";

const normal = resolveTTD409410OutputRate({
  destination: "commercial_resale",
  operation: "internal",
  aliquotaPercent: 17,
  productClass: "other",
  continuousTTDMonths: 48,
});

if (normal.status !== "calculated" || normal.targetTaxLoadPercent !== 1 || Math.abs(normal.presumedCreditPercentOfOutputICMS - 94.11764705882354) > 1e-9) {
  throw new Error(`Falha no cenário 1%: ${JSON.stringify(normal)}`);
}

const initial = resolveTTD409410OutputRate({
  destination: "commercial_resale",
  operation: "internal",
  aliquotaPercent: 17,
  productClass: "other",
  continuousTTDMonths: 12,
});

if (initial.status !== "calculated" || initial.targetTaxLoadPercent !== 2.6 || Math.abs(initial.presumedCreditPercentOfOutputICMS - 84.70588235294117) > 1e-9) {
  throw new Error(`Falha no cenário 2,6%: ${JSON.stringify(initial)}`);
}

const metal = resolveTTD409410OutputRate({
  destination: "commercial_resale",
  operation: "internal",
  aliquotaPercent: 17,
  productClass: "steel_copper_coke_aluminum_silver",
  continuousTTDMonths: 1,
});

if (metal.targetTaxLoadPercent !== 0.6) {
  throw new Error(`Falha no cenário metal: ${JSON.stringify(metal)}`);
}

const industrial = resolveTTD409410OutputRate({
  destination: "industrialization",
  operation: "internal",
  aliquotaPercent: 17,
  industrializationInSC: true,
  originalCharacteristicsMaintained: true,
  sameNcmPosition: false,
});

if (industrial.status !== "conditional") {
  throw new Error(`Falha no cenário industrial: ${JSON.stringify(industrial)}`);
}

console.log("TTD 409/410 output rate: PASS");
