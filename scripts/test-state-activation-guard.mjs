import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateStateActivation, STATE_ACTIVATION_APPROVALS } from "../lib/state-activation-guard.ts";
import { STATE_JURISDICTION_REGISTRY } from "../lib/state-jurisdiction-registry.ts";
import { calculateUnifiedImportSimulation } from "../lib/unified-import-simulation.ts";

const current = evaluateStateActivation();
assert.equal(current.status, "safe");
assert.deepEqual(current.activeUfs, ["SC"]);
assert.deepEqual(current.violations, []);

const registryOnly = STATE_JURISDICTION_REGISTRY.map((entry) =>
  entry.uf === "SP"
    ? { ...entry, status: "homologated", stateEngine: "SC", reasonCode: "homologated_sc" }
    : entry,
);
const registryOnlyResult = evaluateStateActivation(registryOnly, STATE_ACTIVATION_APPROVALS);
assert.equal(registryOnlyResult.status, "blocked");
assert(registryOnlyResult.violations.some((issue) => issue.includes("SP: homologated_without_activation_approval")));
assert(!registryOnlyResult.activeUfs.includes("SP"));

const approvalOnly = [
  ...STATE_ACTIVATION_APPROVALS,
  { uf: "SP", approvalId: "synthetic-sp", stateEngineId: "SP", legalReviewVerified: true, regressionsVerified: true },
];
const approvalOnlyResult = evaluateStateActivation(STATE_JURISDICTION_REGISTRY, approvalOnly);
assert.equal(approvalOnlyResult.status, "safe");
assert(!approvalOnlyResult.activeUfs.includes("SP"), "approval alone must not activate an unsupported UF");

const base = {
  date: "2026-09-10",
  exchange: 5.5,
  items: [{ itemId: "A", ncm: "32081020", origin: "México", quantity: 1, weightKg: 1, fobUnit: 100, icms: 17 }],
};
assert.throws(() => calculateUnifiedImportSimulation({ ...base, destinationUf: "SP" }), /não homologada/i);

const implementation = fs.readFileSync("lib/state-activation-guard.ts", "utf8");
const route = fs.readFileSync("app/api/state-homologation/status/route.ts", "utf8");
assert.doesNotMatch(implementation, /\b(iiRate|ipiRate|pisRate|cofinsRate|icmsRate)\b\s*:/i);
assert.match(implementation, /two_key_fail_closed/);
assert.match(route, /assertStateActivationSafe/);
assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/);

console.log("Stage 15 state activation guard: OK — registry and reviewed approval are both required; SP remains blocked");
