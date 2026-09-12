import assert from "node:assert/strict";
import fs from "node:fs";
import { getReleaseScope, RELEASE_SCOPE_CONTRACT } from "../lib/release-scope.ts";
import { calculateUnifiedImportSimulation } from "../lib/unified-import-simulation.ts";

const release = getReleaseScope();
assert.equal(release.contract, RELEASE_SCOPE_CONTRACT);
assert.equal(release.policy, "explicit_scope_fail_closed");
assert.equal(release.controlledBeta.status, "released_with_restrictions");
assert.deepEqual(release.controlledBeta.activeUfs, ["SC"]);
assert.match(release.controlledBeta.label, /Beta controlado/i);
assert.match(release.controlledBeta.notice, /apenas para Santa Catarina/i);
assert.equal(release.unrestrictedCommercial.status, "blocked_by_state_scope");
assert.equal(release.unrestrictedCommercial.missingUfCount, 26);
assert.match(release.unrestrictedCommercial.notice, /Lançamento nacional irrestrito bloqueado/i);

const layout = fs.readFileSync("app/layout.tsx", "utf8");
assert.match(layout, /getReleaseScope/);
assert.match(layout, /data-release-scope="controlled-beta"/);
assert.match(layout, /controlledBeta\.notice/);

const route = fs.readFileSync("app/api/release-scope/route.ts", "utf8");
assert.match(route, /getReleaseScope/);
assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/);

const base = {
  date: "2026-09-10",
  exchange: 5.5,
  items: [{ itemId: "A", ncm: "32081020", origin: "México", quantity: 1, weightKg: 1, fobUnit: 100, icms: 17 }],
};
assert.doesNotThrow(() => calculateUnifiedImportSimulation({ ...base, destinationUf: "SC" }));
assert.throws(() => calculateUnifiedImportSimulation({ ...base, destinationUf: "SP" }), /não homologada/i);

const implementation = fs.readFileSync("lib/release-scope.ts", "utf8");
assert.doesNotMatch(implementation, /\b(iiRate|ipiRate|pisRate|cofinsRate|icmsRate)\b\s*:/i);
console.log("Stage 18 release scope: OK — controlled beta is SC-only and national unrestricted release remains blocked");
