import assert from "node:assert/strict";
import fs from "node:fs";
import { getLaunchReadiness, LAUNCH_READINESS_ITEMS, LAUNCH_READINESS_CONTRACT } from "../lib/launch-readiness.ts";

const readiness = getLaunchReadiness();
assert.equal(readiness.contract, LAUNCH_READINESS_CONTRACT);
assert.equal(readiness.policy, "evidence_based_fail_closed");
assert.equal(readiness.release.unrestrictedCommercial, "blocked_by_state_scope");
assert.equal(readiness.release.controlledBeta, "eligible_for_release_review");
assert.deepEqual(readiness.release.activeStateScope, ["SC", "SP"]);
assert.deepEqual(readiness.summary.p0BlockingIds, []);
assert.equal(readiness.summary.verified, 14);
assert.equal(readiness.summary.pending, 0);
assert.equal(readiness.summary.inProgress, 1);

for (const item of LAUNCH_READINESS_ITEMS) {
  assert.ok(item.evidence.length > 0, `${item.id} must have evidence`);
  for (const path of item.evidence) assert.ok(fs.existsSync(path), `${item.id} evidence missing: ${path}`);
}

const p0Verified = LAUNCH_READINESS_ITEMS.filter((item) => item.priority === "P0" && item.status === "verified");
assert.equal(p0Verified.length, LAUNCH_READINESS_ITEMS.filter((item) => item.priority === "P0").length);
assert.ok(p0Verified.some((item) => item.id === "p0-defense-commercial-p0"));
assert.ok(p0Verified.some((item) => item.id === "p0-state-scope"));
assert.equal(LAUNCH_READINESS_ITEMS.find((item) => item.id === "p0-e2e-independent")?.status, "verified");
assert.equal(LAUNCH_READINESS_ITEMS.find((item) => item.id === "p2-state-expansion")?.status, "in_progress");

const route = fs.readFileSync("app/api/launch-readiness/route.ts", "utf8");
assert.match(route, /getLaunchReadiness/);
assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/);

const checklist = fs.readFileSync("docs/launch-checklist.md", "utf8");
assert.match(checklist, /lib\/launch-readiness\.ts/);
assert.match(checklist, /api\/launch-readiness/);
assert.doesNotMatch(checklist, /- \[ \]/, "launch checklist must not duplicate stale manual checkboxes");

console.log("Launch readiness: OK — all P0 evidence verified; controlled beta covers SC and SP while national release remains scope-blocked");
