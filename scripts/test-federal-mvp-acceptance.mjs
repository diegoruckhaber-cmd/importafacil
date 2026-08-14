import assert from "node:assert/strict";
import { resolveCofinsImport2026, resolveFederalRegime } from "../lib/federal-2026-import-rules.ts";
import { resolveFederalII2026 } from "../lib/federal-ii-2026-rules.ts";
import { validateFederal2026Foundation } from "../lib/federal-2026-foundation-catalog.ts";

// Locked federal MVP acceptance coverage. The test deliberately verifies
// conservative behavior: standard taxation is calculable, 2026 PIS/Cofins
// changes are represented, and special regimes never become automatic zeros.

const standardCofins = resolveCofinsImport2026({ date: "2026-03-31" });
assert.equal(standardCofins.effectiveRate, 9.65);

const reducedCofins = resolveCofinsImport2026({
  date: "2026-04-01",
  reducedBenefit: true,
});
assert.equal(reducedCofins.effectiveRate, 0.965);
assert.equal(reducedCofins.displayRate, 0.97);

const reducedCofinsPlus060 = resolveCofinsImport2026({
  date: "2026-04-01",
  reducedBenefit: true,
  additional060: true,
});
assert.equal(reducedCofinsPlus060.effectiveRate, 1.565);
assert.equal(reducedCofinsPlus060.displayRate, 1.57);

const specialRegime = resolveFederalRegime("drawback_suspension");
assert.equal(specialRegime.automaticZeroRates, false);
assert.equal(specialRegime.requiresSpecificLegalBasis, true);

const normalII = resolveFederalII2026({
  date: "2026-08-14",
  statutoryRate: 12,
});
assert.equal(normalII.payableRate, 12);

const reducedII = resolveFederalII2026({
  date: "2026-08-14",
  statutoryRate: 12,
  reducedRate: 8,
  benefitKind: "reduced_rate",
});
assert.equal(reducedII.payableRate, 8);

const foundation = validateFederal2026Foundation({
  code: "0920",
  tax: "II",
});
assert.equal(foundation.valid, true);
assert.ok(foundation.entry);
assert.ok(foundation.warnings.length > 0);

console.log("PASS: federal MVP acceptance scenario");
console.log(JSON.stringify({
  standardCofins: standardCofins.effectiveRate,
  reducedCofins: reducedCofins.effectiveRate,
  reducedCofinsPlus060: reducedCofinsPlus060.effectiveRate,
  normalII: normalII.payableRate,
  reducedII: reducedII.payableRate,
  drawbackFoundationValidated: foundation.valid,
}, null, 2));
