import assert from "node:assert/strict";
import fs from "node:fs";
import { getStateHomologationPreflightContract, validateStateHomologationPackage } from "../lib/state-homologation-package.ts";
import { resolveStateJurisdiction } from "../lib/state-jurisdiction-registry.ts";
import { calculateUnifiedImportSimulation } from "../lib/unified-import-simulation.ts";

const contract = getStateHomologationPreflightContract();
assert.equal(contract.policy, "fail_closed");
assert.equal(contract.activatesJurisdiction, false);

const blocked = validateStateHomologationPackage({
  uf: "PE",
  stateEngineId: "",
  auditedAt: "",
  legalSources: [],
  regressionScripts: [],
});
assert.equal(blocked.status, "blocked");
assert.equal(blocked.activatesJurisdiction, false);
assert(blocked.blockingIssues.includes("state_engine_required"));
assert(blocked.blockingIssues.includes("legal_sources_required"));
assert(blocked.blockingIssues.includes("regression_evidence_required"));

const reviewable = validateStateHomologationPackage({
  uf: "PE",
  stateEngineId: "PE-CANDIDATE",
  auditedAt: "2026-09-12",
  legalSources: [{
    id: "SYNTHETIC-OFFICIAL-EVIDENCE",
    officialUrl: "https://example.gov.br/official-source",
    validityStatus: "verified",
    effectiveFrom: "2026-01-01",
    effectiveUntil: null,
  }],
  regressionScripts: ["scripts/test-pe-candidate.mjs"],
});
assert.equal(reviewable.status, "eligible_for_review");
assert.equal(reviewable.activatesJurisdiction, false);
assert.equal(resolveStateJurisdiction("PE")?.status, "unsupported", "preflight evidence must never activate a jurisdiction");

const base = {
  date: "2026-09-10",
  exchange: 5.5,
  items: [{ itemId: "A", ncm: "32081020", origin: "México", quantity: 1, weightKg: 1, fobUnit: 100, icms: 17 }],
};
assert.throws(() => calculateUnifiedImportSimulation({ ...base, destinationUf: "PE" }), /não homologada/i, "candidate package must not bypass production fail-closed behavior");

const implementation = fs.readFileSync("lib/state-homologation-package.ts", "utf8");
const route = fs.readFileSync("app/api/state-homologation/preflight/route.ts", "utf8");
assert.doesNotMatch(implementation, /\b(iiRate|ipiRate|pisRate|cofinsRate|icmsRate)\b\s*:/i);
assert.match(implementation, /activatesJurisdiction: false/);
assert.match(route, /export async function GET/);
assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/);

console.log("Stage 14 state homologation preflight: OK — evidence may become reviewable but cannot activate an unsupported UF");
