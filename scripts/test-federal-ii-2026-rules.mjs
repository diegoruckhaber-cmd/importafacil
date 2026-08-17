import assert from "node:assert/strict";
import { resolveFederalII2026 } from "../lib/federal-ii-2026-rules.ts";

const normal = resolveFederalII2026({ date: "2026-08-13", statutoryRate: 12, benefitKind: "none" });
assert.equal(normal.effectiveRate, 12);

const reduced = resolveFederalII2026({ date: "2026-08-13", statutoryRate: 12, benefitKind: "reduced_rate", reducedRate: 4 });
assert.equal(reduced.effectiveRate, 4);

const lc224Reduced = resolveFederalII2026({ date: "2026-08-13", statutoryRate: 12, benefitKind: "reduced_rate", reducedRate: 4, coveredByLC224: true });
assert.equal(lc224Reduced.effectiveRate, 4.8);
assert.equal(lc224Reduced.benefitReductionPercent, 90);

const lc224Exception = resolveFederalII2026({ date: "2026-08-13", statutoryRate: 12, benefitKind: "reduced_rate", reducedRate: 4, coveredByLC224: true, exceptionToLC224: true });
assert.equal(lc224Exception.effectiveRate, 4);

const exemption = resolveFederalII2026({ date: "2026-08-13", statutoryRate: 12, benefitKind: "exemption" });
assert.equal(exemption.effectiveRate, 0);

const lc224Exemption = resolveFederalII2026({ date: "2026-08-13", statutoryRate: 12, benefitKind: "exemption", coveredByLC224: true });
assert.ok(Math.abs(lc224Exemption.effectiveRate - 1.2) < 1e-9);

const suspension = resolveFederalII2026({ date: "2026-08-13", statutoryRate: 12, benefitKind: "suspension" });
assert.equal(suspension.effectiveRate, 0);
assert.match(suspension.warning ?? "", /Suspensão/);

console.log("OK: regras de II federal 2026");
