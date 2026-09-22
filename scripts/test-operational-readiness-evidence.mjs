import assert from "node:assert/strict";
import {
  assessAuditRun,
  mdicReconciliationStatus,
  newestFederalWorkbook,
  newestTipiUpdate,
} from "../lib/operational-readiness.ts";

const now = Date.parse("2026-09-22T20:00:00Z");

assert.equal(
  assessAuditRun({ status: "completed", conclusion: "success", updated_at: "2026-09-22T19:00:00Z" }, 48, now),
  "passed",
);
assert.equal(
  assessAuditRun({ status: "completed", conclusion: "failure", updated_at: "2026-09-22T19:00:00Z" }, 48, now),
  "failed",
);
assert.equal(
  assessAuditRun({ status: "completed", conclusion: "success", updated_at: "2026-09-19T19:00:00Z" }, 48, now),
  "stale",
);
assert.equal(mdicReconciliationStatus([{ id: "mdic", status: "passed" }]), "current");
assert.equal(mdicReconciliationStatus([{ id: "mdic", status: "failed" }]), "pending");
assert.equal(mdicReconciliationStatus([{ id: "federal", status: "passed" }]), "pending");

assert.equal(
  newestFederalWorkbook('<a href="08-09-2026-anexos-i-a-x-resolucao-gecex-272-21.xlsx">x</a>'),
  "2026-09-08",
);
assert.equal(
  newestTipiUpdate("<p>Atualizado em 13/02/2026</p>"),
  "2026-02-13",
);

console.log("Operational readiness evidence gate: OK");
