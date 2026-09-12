import assert from "node:assert/strict";
import fs from "node:fs";
import { BRAZILIAN_UFS, getStateJurisdictionRegistry, resolveStateJurisdiction, STATE_JURISDICTION_CONTRACT } from "../lib/state-jurisdiction-registry.ts";
import { calculateUnifiedImportSimulation } from "../lib/unified-import-simulation.ts";
const registry = getStateJurisdictionRegistry();
assert.equal(registry.contract, STATE_JURISDICTION_CONTRACT); assert.equal(BRAZILIAN_UFS.length, 27); assert.equal(registry.entries.length, 27);
assert.deepEqual(registry.homologatedUfs, ["ES", "PE", "SC", "SP"]);
for (const uf of ["ES", "PE", "SC", "SP"]) assert.equal(resolveStateJurisdiction(uf)?.status, "homologated");
for (const uf of ["ES", "PE", "SP"]) { assert.equal(resolveStateJurisdiction(uf)?.stateEngine, "GENERAL"); assert.equal(resolveStateJurisdiction(uf)?.scope, "general_rate_only"); }
assert.equal(resolveStateJurisdiction("XX"), null);
assert.ok(registry.entries.filter((entry) => entry.status === "unsupported").every((entry) => entry.stateEngine === null && entry.legalFoundationIds.length === 0));
const base = { date: "2026-09-12", exchange: 5.5, freight: 0, insurance: 0, items: [{ itemId: "A", ncm: "32081020", origin: "México", quantity: 1, weightKg: 1, fobUnit: 100, icms: 12 }] };
for (const uf of ["SC", "SP", "ES", "PE"]) assert.doesNotThrow(() => calculateUnifiedImportSimulation({ ...base, destinationUf: uf }));
assert.throws(() => calculateUnifiedImportSimulation({ ...base, destinationUf: "PR" }), /não homologada/i);
const implementation = fs.readFileSync("lib/state-jurisdiction-registry.ts", "utf8"); const route = fs.readFileSync("app/api/state-jurisdictions/route.ts", "utf8");
assert.doesNotMatch(implementation, /\b(iiRate|ipiRate|pisRate|cofinsRate|icmsRate)\b\s*:/i); assert.match(implementation, /policy: "fail_closed"/); assert.match(route, /export async function GET/); assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/);
console.log("State jurisdiction registry: OK — ES, PE, SC and SP homologated in explicit scopes; remaining UFs fail closed");
