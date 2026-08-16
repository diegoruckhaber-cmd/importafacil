import { SC_IMPORT_SPECIAL_REGIMES_2026 } from "../lib/sc-import-special-regimes.ts";
import { decideSCItem } from "../lib/sc-decision-engine.ts";

const industrial = SC_IMPORT_SPECIAL_REGIMES_2026.find((rule) => rule.id === "SC-AN3-ART10-II-INDUSTRIAL");
if (!industrial) throw new Error("Industrial special regime missing from catalog.");
if (industrial.legalBasis !== "RICMS/SC-01, Anexo 3, art. 10, II") throw new Error("Industrial legal basis mismatch.");

const conditional = decideSCItem({
  id: "API-TEST",
  specialRegimeIds: [industrial.id],
  specialRegimeContext: {
    operation: { kind: "import_entry" },
    specialRegime: { art10: true },
    purpose: "industrialization",
    customs: { entryState: "SC" },
  },
});
if (conditional.decision !== "conditional") throw new Error(`Expected conditional, got ${conditional.decision}.`);
if (!conditional.blockingIssues.includes("condition_required:industrializationState")) throw new Error("Missing evidence was not surfaced.");

const applied = decideSCItem({
  id: "API-TEST-2",
  specialRegimeIds: [industrial.id],
  specialRegimeContext: {
    operation: { kind: "import_entry" },
    specialRegime: { art10: true },
    purpose: "industrialization",
    industrializationState: "SC",
    customs: { entryState: "SC" },
  },
});
if (applied.decision !== "apply") throw new Error(`Expected apply, got ${applied.decision}.`);

console.log("SC special regime API contract test: PASS");
