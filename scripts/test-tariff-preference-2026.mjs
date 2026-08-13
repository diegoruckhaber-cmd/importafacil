import assert from "node:assert/strict";
import { resolveTariffPreference2026 } from "../lib/tariff-preference-2026.ts";

const eligible = resolveTariffPreference2026({ date: "2026-05-01", ncm: "00000000", originCountry: "UE", agreement: "MERCOSUR_EU", originEligible: true, preferentialRate: 0 });
assert.equal(eligible.eligible, true);
assert.equal(eligible.quotaStatus, "not_applicable");

const noOrigin = resolveTariffPreference2026({ date: "2026-05-01", ncm: "00000000", originCountry: "CN", agreement: "MERCOSUR_EU", originEligible: true });
assert.equal(noOrigin.eligible, false);

const quotaMissing = resolveTariffPreference2026({ date: "2026-05-01", ncm: "00000000", originCountry: "UE", agreement: "MERCOSUR_EU", originEligible: true, quotaRequired: true });
assert.equal(quotaMissing.eligible, false);
assert.equal(quotaMissing.quotaStatus, "required");

const beforeStart = resolveTariffPreference2026({ date: "2026-04-30", ncm: "00000000", originCountry: "UE", agreement: "MERCOSUR_EU", originEligible: true });
assert.equal(beforeStart.eligible, false);

console.log("PASS tariff preference 2026");
