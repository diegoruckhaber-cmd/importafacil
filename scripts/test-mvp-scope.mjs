import assert from "node:assert/strict";
import { decideSCItem } from "../lib/sc-decision-engine.ts";
import { resolveCofinsImport2026 } from "../lib/federal-2026-import-rules.ts";
import { resolveFederalII2026 } from "../lib/federal-ii-2026-rules.ts";

const scCommercial = decideSCItem({
  id: "SC-001",
  ttd: 410,
  destination: "commercial_resale",
  validConcession: true,
  importEntryInSC: true,
  sameNcmPositionAfterFractionation: true,
});
assert.equal(scCommercial.decision, "apply");

const scIndustrial = decideSCItem({
  id: "SC-002",
  ttd: 410,
  destination: "industrialization",
  validConcession: true,
  importEntryInSC: true,
  sameNcmPositionAfterFractionation: true,
});
assert.equal(scIndustrial.decision, "conditional");
assert.ok(scIndustrial.blockingIssues.includes("industrial_output_treatment_required"));

const cofins = resolveCofinsImport2026({ date: "2026-08-14", reducedBenefit: true });
assert.equal(cofins.effectiveRate, 0.965);

const ii = resolveFederalII2026({ date: "2026-08-14", statutoryRate: 12 });
assert.equal(ii.payableRate, 12);

console.log("PASS: combined SC + federal MVP scope");
console.log(JSON.stringify({
  scCommercial: scCommercial.decision,
  scIndustrial: scIndustrial.decision,
  cofinsEffectiveRate: cofins.effectiveRate,
  iiPayableRate: ii.payableRate,
}, null, 2));
