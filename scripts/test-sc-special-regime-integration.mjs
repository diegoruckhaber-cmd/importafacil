import assert from "node:assert/strict";
import { decideSCItem } from "../lib/sc-decision-engine.ts";
import { calculateSCRealOperation } from "../lib/sc-real-calculation-flow.ts";

const industrial = decideSCItem({
  id: "item-1",
  specialRegimeIds: ["SC-AN3-ART10-II-INDUSTRIAL"],
  specialRegimeContext: {
    operation: { kind: "import_entry" },
    specialRegime: { art10: true },
    purpose: "industrialization",
    industrializationState: "SC",
    customs: { entryState: "SC" },
  },
});
assert.equal(industrial.decision, "apply");
assert.equal(industrial.ruleIds?.[0], "SC-AN3-ART10-II-INDUSTRIAL");
assert.equal(industrial.blockingIssues.length, 0);

const mismatch = decideSCItem({
  id: "item-2",
  specialRegimeIds: ["SC-AN3-ART10-II-INDUSTRIAL"],
  specialRegimeContext: {
    operation: { kind: "import_entry" },
    specialRegime: { art10: true },
    purpose: "resale",
    industrializationState: "SC",
    customs: { entryState: "SC" },
  },
});
assert.equal(mismatch.decision, "deny");
assert.ok(mismatch.blockingIssues.some((x) => x === "condition_mismatch:purpose"));

const lookup = decideSCItem({
  id: "item-3",
  specialRegimeIds: ["SC-AN3-ART10-IV-ACTIVE"],
  specialRegimeContext: {
    operation: { kind: "import_entry" },
    specialRegime: { art10: true },
    product: { ncm: "8543.89.90" },
    purpose: "fixed_asset",
    customs: { entryState: "SC" },
  },
});
assert.equal(lookup.decision, "conditional");
assert.ok(lookup.blockingIssues.includes("special_regime_requires_lookup"));

const endToEnd = calculateSCRealOperation({
  ncm: "32081020",
  quantity: 1,
  unitFobUsd: 100,
  exchangeRate: 5,
  freightUsd: 10,
  insuranceUsd: 0,
  iiRate: 10,
  ipiRate: 0,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsRate: 17,
  specialRegimeIds: ["SC-AN3-ART10-II-INDUSTRIAL"],
  specialRegimeContext: {
    operation: { kind: "import_entry" },
    specialRegime: { art10: true },
    purpose: "industrialization",
    industrializationState: "SC",
    customs: { entryState: "SC" },
  },
});
assert.equal(endToEnd.status, "calculated");
assert.equal(endToEnd.benefit, null);
assert.equal(endToEnd.decision.decision, "apply");
assert.ok(endToEnd.decision.ruleIds?.includes("SC-AN3-ART10-II-INDUSTRIAL"));

console.log("SC special regime integration tests passed");
