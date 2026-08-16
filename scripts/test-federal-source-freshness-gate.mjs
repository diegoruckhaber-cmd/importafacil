import assert from "node:assert/strict";
import {
  FEDERAL_SOURCE_BASELINE_2026,
  assertFreshFederalSnapshot,
  isSnapshotAtLeastAsFresh,
} from "../lib/federal-source-freshness-gate-2026.ts";

assert.equal(FEDERAL_SOURCE_BASELINE_2026.MDIC_TARIFF.officialPageUpdatedAt, "2026-08-12");
assert.equal(FEDERAL_SOURCE_BASELINE_2026.RFB_TIPI.officialPageUpdatedAt, "2026-02-13");
assert.equal(isSnapshotAtLeastAsFresh({ source: "MDIC_TARIFF", sourceUpdatedAt: "2026-08-12", checkedAt: "2026-08-15" }), true);
assert.equal(isSnapshotAtLeastAsFresh({ source: "MDIC_TARIFF", sourceUpdatedAt: "2026-08-11", checkedAt: "2026-08-15" }), false);
assert.doesNotThrow(() => assertFreshFederalSnapshot({ source: "RFB_TIPI", sourceUpdatedAt: "2026-02-13", checkedAt: "2026-08-15" }));
assert.throws(() => assertFreshFederalSnapshot({ source: "RFB_TIPI", sourceUpdatedAt: "2026-02-12", checkedAt: "2026-08-15" }), /stale/);

console.log("Federal source freshness gate acceptance: OK");
