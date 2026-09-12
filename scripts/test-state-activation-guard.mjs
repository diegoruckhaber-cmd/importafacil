import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateStateActivation, STATE_ACTIVATION_APPROVALS } from "../lib/state-activation-guard.ts";
import { STATE_JURISDICTION_REGISTRY } from "../lib/state-jurisdiction-registry.ts";
import { calculateUnifiedImportSimulation } from "../lib/unified-import-simulation.ts";

const current = evaluateStateActivation();
assert.equal(current.status, "safe");
assert.deepEqual(current.activeUfs, ["SC", "SP"]);
assert.deepEqual(current.violations, []);

const withoutSpApproval = STATE_ACTIVATION_APPROVALS.filter((approval) => approval.uf !== "SP");
const registryOnlyResult = evaluateStateActivation(STATE_JURISDICTION_REGISTRY, withoutSpApproval);
assert.equal(registryOnlyResult.status, "blocked");
assert(registryOnlyResult.violations.some((issue) => issue.includes("SP: homologated_without_activation_approval")));
assert(!registryOnlyResult.activeUfs.includes("SP"));

const unsupportedEsApproval = [
  ...STATE_ACTIVATION_APPROVALS,
  { uf: "ES", approvalId: "synthetic-es", stateEngineId: "GENERAL", legalReviewVerified: true, regressionsVerified: true },
];
const approvalOnlyResult = evaluateStateActivation(STATE_JURISDICTION_REGISTRY, unsupportedEsApproval);
assert.equal(approvalOnlyResult.status, "safe");
assert(!approvalOnlyResult.activeUfs.includes("ES"), "approval alone must not activate an unsupported UF");

const base = {
  date: "2026-09-10",
  exchange: 5.5,
  items: [{ itemId: "A", ncm: "32081020", origin: "México", quantity: 1, weightKg: 1, fobUnit: 100, icms: 17 }],
};
assert.doesNotThrow(() => calculateUnifiedImportSimulation({ ...base, destinationUf: "SP" }));
assert.throws(() => calculateUnifiedImportSimulation({ ...base, destinationUf: "ES" }), /não homologada/i);

const implementation = fs.readFileSync("lib/state-activation-guard.ts", "utf8");
const route = fs.readFileSync("app/api/state-homologation/status/route.ts", "utf8");
assert.doesNotMatch(implementation, /\b(iiRate|ipiRate|pisRate|cofinsRate|icmsRate)\b\s*:/i);
assert.match(implementation, /two_key_fail_closed/);
assert.match(route, /assertStateActivationSafe/);
assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/);

console.log("State activation guard: OK — SC and SP require both registry homologation and reviewed activation; unsupported UFs remain blocked");
