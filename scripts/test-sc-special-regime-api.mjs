import { GET as getSpecialRegimes } from "../app/api/sc-special-regimes/route.ts";
import { decideSCItem } from "../lib/sc-decision-engine.ts";

const response = await getSpecialRegimes();
if (!response.ok) throw new Error("SC special regime catalog endpoint did not return 200.");
const payload = await response.json();

if (payload.count < 1 || !Array.isArray(payload.regimes)) {
  throw new Error("SC special regime catalog payload is invalid.");
}

const industrial = payload.regimes.find((rule) => rule.id === "SC-AN3-ART10-II-INDUSTRIAL");
if (!industrial) throw new Error("Industrial special regime missing from API catalog.");
if (industrial.legalBasis !== "RICMS/SC-01, Anexo 3, art. 10, II") {
  throw new Error("Industrial special regime legal basis mismatch.");
}

const conditional = decideSCItem({
  id: "API-TEST",
  specialRegimeIds: [industrial.id],
  specialRegimeContext: {
    operation: { kind: "import_entry" },
    specialRegime: { art10: true },
    purpose: "industrialization",
    industrializationState: "SC",
    customs: { entryState: "SC" },
  },
});

if (conditional.decision !== "conditional") {
  throw new Error(`Expected conditional decision, got ${conditional.decision}.`);
}
if (!conditional.blockingIssues.includes("condition_required:industrializationState")) {
  throw new Error("Missing evidence was not surfaced as a blocking condition.");
}

console.log("SC special regime API integration test: PASS");
