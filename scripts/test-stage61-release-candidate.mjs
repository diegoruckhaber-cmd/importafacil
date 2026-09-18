import assert from "node:assert/strict";
import fs from "node:fs";
import { getReleaseCandidateStatus } from "../lib/release-candidate.ts";

const candidate=getReleaseCandidateStatus();
assert.equal(candidate.contract,"importafacil-release-candidate-v1");
assert.equal(candidate.candidate,"RC-2026-09-18");
assert.equal(candidate.technicalStatus,"ready_for_production_validation");
assert.equal(candidate.activeUfCount,27);
assert.equal(new Set(candidate.activeUfs).size,27);
assert.deepEqual(candidate.p0BlockingIds,[]);
assert.equal(candidate.controlledBetaStatus,"released_with_restrictions");
assert.equal(candidate.unrestrictedCommercialStatus,"eligible_for_release_review");
assert.equal(candidate.manualCommercialAuthorizationRequired,true);
assert.equal(candidate.releaseScopeChangedByThisCandidate,false);
assert.ok(Object.values(candidate.checks).every(Boolean));

const route=fs.readFileSync("app/api/release-candidate/route.ts","utf8");
assert.match(route,/getReleaseCandidateStatus/);
assert.match(route,/ready_for_production_validation/);
assert.match(route,/Cache-Control/);
assert.match(route,/no-store/);

const releaseScope=fs.readFileSync("lib/release-scope.ts","utf8");
assert.match(releaseScope,/eligible_for_release_review/);
assert.doesNotMatch(releaseScope,/released_unrestricted/);

const doc=fs.readFileSync("docs/stage61-release-candidate.md","utf8");
assert.match(doc,/does \*\*not\*\* authorize unrestricted commercial release/i);
assert.match(doc,/Leaked Password Protection/);
assert.match(doc,/27 Brazilian UFs/);

console.log("Stage 61 release candidate regression passed.");
