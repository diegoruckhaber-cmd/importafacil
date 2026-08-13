import { runSCEndToEnd } from "../lib/sc-end-to-end.ts";

const result = runSCEndToEnd([
  {
    id: "ITEM-1",
    ttd: 409,
    destination: "commercial_resale",
    importEntryInSC: true,
    validConcession: true,
    normalICMS: 26100,
    benefitICMS: 6500,
    effect: { kind: "presumed_credit", creditOnOutput: true, notes: ["Parâmetros jurídicos validados devem alimentar o efeito financeiro."] },
  },
]);

if (result.status !== "calculated") throw new Error(JSON.stringify(result));
if (result.totalBenefitICMS !== 6500) throw new Error(JSON.stringify(result));
if (result.totalEstimatedSavings !== 19600) throw new Error(JSON.stringify(result));

const multi = runSCEndToEnd([
  {
    id: "COMMERCIAL",
    ttd: 410,
    destination: "commercial_resale",
    importEntryInSC: true,
    validConcession: true,
    normalICMS: 10000,
    benefitICMS: 3000,
    effect: { kind: "presumed_credit", creditOnOutput: true, notes: [] },
  },
  {
    id: "INDUSTRIAL",
    ttd: 410,
    destination: "industrialization",
    importEntryInSC: true,
    validConcession: true,
    normalICMS: 9000,
    benefitICMS: 0,
    effect: { kind: "presumed_credit", creditOnOutput: true, notes: [] },
  },
]);

if (multi.status !== "conditional") throw new Error(JSON.stringify(multi));
if (multi.totalBenefitICMS !== null) throw new Error(JSON.stringify(multi));

console.log("SC end-to-end composition: PASS (static assertions)");
