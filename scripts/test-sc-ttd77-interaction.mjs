import { decideTTD77Interaction } from "../lib/sc-ttd77-interaction.ts";

const commercial = decideTTD77Interaction({
  ttd409Or410: true,
  ttd77: true,
  destination: "commercial_resale",
  importedUnderTTD409Or410: true,
  validTTD77: true,
});

if (commercial.decision !== "apply" || commercial.importTreatment !== "ttd409_410") {
  throw new Error(`Falha comercial: ${JSON.stringify(commercial)}`);
}

const industrial = decideTTD77Interaction({
  ttd409Or410: true,
  ttd77: true,
  destination: "industrialization",
  importedUnderTTD409Or410: true,
  validTTD77: true,
  industrializationInSC: true,
  sameNcmPositionAfterIndustrialization: true,
});

if (industrial.decision !== "conditional" || industrial.outputTreatment !== "normal") {
  throw new Error(`Falha industrial: ${JSON.stringify(industrial)}`);
}

const outsideSC = decideTTD77Interaction({
  ttd409Or410: true,
  ttd77: true,
  destination: "industrialization",
  importedUnderTTD409Or410: true,
  validTTD77: true,
  industrializationInSC: false,
});

if (outsideSC.decision !== "deny") {
  throw new Error(`Falha industrialização fora de SC: ${JSON.stringify(outsideSC)}`);
}

console.log("TTD 77 interaction matrix: PASS");
