import { describeTTD409410Effect } from "../lib/sc-ttd409-410-effect.ts";

const commercial = describeTTD409410Effect(410, {
  destination: "commercial_resale",
  sameNcmPositionAfterFractionation: true,
});

if (commercial.kind !== "presumed_credit" || commercial.creditOnOutput !== true) {
  throw new Error(`Falha no cenário comercial: ${JSON.stringify(commercial)}`);
}

const industrial = describeTTD409410Effect(410, {
  destination: "industrialization",
});

if (industrial.kind !== "conditional") {
  throw new Error(`Falha no cenário industrial: ${JSON.stringify(industrial)}`);
}

const changedNcm = describeTTD409410Effect(409, {
  destination: "commercial_resale",
  sameNcmPositionAfterFractionation: false,
});

if (changedNcm.kind !== "conditional") {
  throw new Error(`Falha no cenário de NCM alterada: ${JSON.stringify(changedNcm)}`);
}

console.log("SC TTD 409/410 effects: PASS");
