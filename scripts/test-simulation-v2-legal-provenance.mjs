import assert from "node:assert/strict";
import fs from "node:fs";
import { runImportSimulationV2 } from "../lib/simulation-v2.ts";
import { buildSimulationV2LegalTrace, formatSimulationV2LegalTrace } from "../lib/simulation-v2-legal-provenance.ts";

const result = runImportSimulationV2({
  scenarioName: "Legal provenance acceptance",
  date: "2026-09-11",
  destinationUf: "SC",
  exchange: 5.5,
  freight: 100,
  insurance: 10,
  storage: 500,
  transportMode: "air",
  declarationType: "di",
  items: [{
    itemId: "ITEM-001",
    name: "Verniz",
    ncm: "32081020",
    origin: "México",
    quantity: 100,
    weightKg: 100,
    fobUnit: 20,
    icms: 17,
    ttd: "none",
    destination: "commercial_resale",
  }],
});

const trace = buildSimulationV2LegalTrace(result);
assert(trace.length >= 2, "II and IPI must have legal trace entries");
const ii = trace.find((entry) => entry.treatment === "II");
const ipi = trace.find((entry) => entry.treatment === "IPI");
assert(ii, "II legal trace missing");
assert(ipi, "IPI legal trace missing");
assert(ii.legalFoundation || ii.source, "II must expose its legal/source provenance");
assert(ipi.legalFoundation || ipi.source, "IPI must expose its legal/source provenance");
assert.equal(ii.itemId, "ITEM-001");
assert.match(formatSimulationV2LegalTrace(ii), /ITEM-001 · II/);

const synthetic = {
  items: [{
    itemId: "ITEM-DC",
    federal: {
      ii: { status: "resolved", warnings: [], candidates: [] },
      ipi: { status: "resolved", warnings: [], candidates: [] },
      defenseCommercial: {
        status: "requires_input",
        measure: "countervailing",
        legalFoundation: "Resolução GECEX de teste",
        source: "MDIC/SECEX",
        sourceUrl: "https://www.gov.br/mdic/exemplo",
        validUntil: "31/12/2030",
        scopeCondition: "Confirmar escopo do produto",
        warnings: ["Nenhum valor calculado automaticamente."],
      },
    },
    sc: {
      ttd: "409",
      decision: "conditional",
      decisionReasons: ["TTD 409 — fundamento jurídico estadual."],
      benefitReasons: [],
      blockingIssues: ["valid_concession_required"],
    },
  }],
};
const specialTrace = buildSimulationV2LegalTrace(synthetic);
const defense = specialTrace.find((entry) => entry.area === "defense_commercial");
const state = specialTrace.find((entry) => entry.area === "state");
assert(defense);
assert.equal(defense.status, "requires_input");
assert.equal(defense.sourceUrl, "https://www.gov.br/mdic/exemplo");
assert.equal(defense.validUntil, "31/12/2030");
assert.match(formatSimulationV2LegalTrace(defense), /Confirmar escopo do produto/);
assert(state);
assert.match(state.legalFoundation ?? "", /fundamento jurídico estadual/);
assert.match(state.reason ?? "", /valid_concession_required/);

const route = fs.readFileSync("app/api/simulation-v2/route.ts", "utf8");
assert.match(route, /buildSimulationV2LegalTrace/);
assert.match(route, /legalTrace/);
assert.match(route, /attentionPoints/);
assert.doesNotMatch(route, /calculateUnifiedImportSimulation|resolveFederalTaxes|resolveDefenseCommercial/);

console.log("Simulation V2 legal provenance: OK — source, validity and reasons projected without tax recalculation");
