import assert from "node:assert/strict";
import fs from "node:fs";
import { getLaunchReadiness } from "../lib/launch-readiness.ts";
import { getReleaseScope } from "../lib/release-scope.ts";
import { evaluateStateActivation } from "../lib/state-activation-guard.ts";

const expectedUfs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const readiness = getLaunchReadiness();
const releaseScope = getReleaseScope();
const activation = evaluateStateActivation();

assert.equal(readiness.summary.totalItems, 15);
assert.equal(readiness.summary.verified, 15);
assert.equal(readiness.summary.inProgress, 0);
assert.equal(readiness.summary.pending, 0);
assert.deepEqual(readiness.summary.p0BlockingIds, []);
assert.deepEqual(readiness.release.activeStateScope, expectedUfs);
assert.equal(new Set(readiness.release.activeStateScope).size, 27);
assert.equal(activation.status, "safe");
assert.deepEqual(activation.activeUfs, expectedUfs);
assert.equal(releaseScope.controlledBeta.status, "released_with_restrictions");
assert.equal(releaseScope.unrestrictedCommercial.status, "eligible_for_release_review");
assert.equal(releaseScope.unrestrictedCommercial.missingUfCount, 0);

const checklist = fs.readFileSync("docs/launch-checklist.md", "utf8");
assert.match(checklist, /15\/15 itens `verified`/);
assert.match(checklist, /27\/27 UFs/);
assert.match(checklist, /zero/);
assert.match(checklist, /released_with_restrictions/);
assert.match(checklist, /eligible_for_release_review/);
assert.match(checklist, /decisão manual de release/);
assert.doesNotMatch(checklist, /único P0 ainda pendente/i);
assert.doesNotMatch(checklist, /escopo estadual ativo:\s*SC/i);
assert.doesNotMatch(checklist, /expansão estadual nacional:\s*em andamento/i);

const stage45 = fs.readFileSync("docs/stage45-national-release-review.md", "utf8");
assert.match(stage45, /não autoriza automaticamente/i);
assert.match(stage45, /elegibilidade técnica/i);
assert.match(stage45, /decisão manual explícita/i);
assert.match(stage45, /general_rate_only/);
assert.match(stage45, /substituição tributária/i);
assert.match(stage45, /fallback silencioso/i);

console.log("Stage 45: OK — national scope is review-eligible, documentation reconciled, unrestricted release remains manual");
