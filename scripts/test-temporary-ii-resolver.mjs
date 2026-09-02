import assert from "node:assert/strict";
import { buildTemporaryIIWarning, loadTemporaryIIAlerts, resolveTemporaryII } from "../lib/temporary-ii-resolver.ts";

const catalog = loadTemporaryIIAlerts();
assert(catalog.length > 0, "temporary II catalog must not be empty");
assert(catalog.every((item) => ["general", "ex", "quota"].includes(item.treatmentType)), "every treatment must have a normalized treatment type");

const normal = resolveTemporaryII("28353920", "2026-09-02", 9);
assert(normal, "28353920 must resolve during its temporary measure");
assert.equal(normal.primary.temporaryRate, 17.5);
assert.equal(normal.primary.treatmentType, "general");
assert.equal(normal.alternatives.length, 0);
assert.match(buildTemporaryIIWarning(normal, 9), /cálculo permanece pela alíquota padrão/);

const ex = resolveTemporaryII("29054400", "2026-09-02", 7.2);
assert(ex, "29054400 must resolve during its temporary measure");
assert.equal(ex.primary.temporaryRate, 20);
assert.equal(ex.hasSpecificTreatment, true);
assert.equal(ex.hasQuotaTreatment, false);
assert.equal(ex.treatments.some((item) => item.treatmentType === "ex" && item.exNumber === "001" && item.temporaryRate === 12.6), true);
assert.match(buildTemporaryIIWarning(ex, 7.2), /Ex 001: 12.6%/);
assert.match(buildTemporaryIIWarning(ex, 7.2), /não são aplicadas automaticamente/);

const quota = resolveTemporaryII("72083700", "2026-09-02", 10.8);
assert(quota, "72083700 must resolve during GECEX 929 temporary measure");
assert.equal(quota.primary.temporaryRate, 25);
assert.equal(quota.primary.treatmentType, "general");
assert.equal(quota.hasQuotaTreatment, true);
assert.equal(quota.treatments.some((item) => item.treatmentType === "quota" && item.temporaryRate === 10.8), true);
assert.equal(quota.treatments.some((item) => item.conditionReference === "Portaria SECEX nº 511/2026"), true);
assert.match(buildTemporaryIIWarning(quota, 10.8), /cota tarifária cadastrada/);
assert.match(buildTemporaryIIWarning(quota, 10.8), /Portaria SECEX nº 511\/2026/);

const quotaWithRateBelowStandard = resolveTemporaryII("73041900", "2026-09-02", 16);
assert(quotaWithRateBelowStandard, "general temporary elevation must still resolve when quota alternative equals the standard rate");
assert.equal(quotaWithRateBelowStandard.primary.temporaryRate, 25);
assert.equal(quotaWithRateBelowStandard.treatments.some((item) => item.treatmentType === "quota" && item.temporaryRate === 16), true);

const expired = resolveTemporaryII("28353920", "2027-01-19", 9);
assert.equal(expired, undefined, "expired temporary measure must not resolve");

const before = resolveTemporaryII("28353920", "2026-01-18", 9);
assert.equal(before, undefined, "future temporary measure must not resolve before start date");

console.log("temporary II resolver audit: OK");
