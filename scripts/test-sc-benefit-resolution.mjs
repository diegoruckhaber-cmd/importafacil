import { resolveSCBenefit } from "../lib/sc-benefit-resolution.ts";

const commercial = resolveSCBenefit({
  ttd: 410,
  destination: "commercial_resale",
  taxableOutput: true,
  normalOutputICMS: 10000,
});

if (commercial.decision !== "apply") throw new Error(JSON.stringify(commercial));
if (!commercial.importDeferred) throw new Error(JSON.stringify(commercial));
if (!commercial.outputPresumedCredit) throw new Error(JSON.stringify(commercial));
if (commercial.benefitICMS !== null) throw new Error(JSON.stringify(commercial));

const industrial = resolveSCBenefit({
  ttd: 410,
  destination: "industrialization",
  taxableOutput: true,
  normalOutputICMS: 10000,
});

if (industrial.decision !== "conditional") throw new Error(JSON.stringify(industrial));
if (industrial.benefitICMS !== null) throw new Error(JSON.stringify(industrial));

console.log("SC benefit resolution: PASS");
