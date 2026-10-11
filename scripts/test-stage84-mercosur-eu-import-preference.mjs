import assert from "node:assert/strict";
import { isEuropeanUnionOrigin, resolveMercosurEuImportPreference } from "../lib/mercosur-eu-import-preference.ts";

assert.equal(isEuropeanUnionOrigin("Alemanha"), true);
assert.equal(isEuropeanUnionOrigin("China"), false);

const conservative = resolveMercosurEuImportPreference({
  date:"2026-11-01", ncm:"32081010", originCountry:"Alemanha", standardIiRate:12.6
});
assert.equal(conservative.potential, true);
assert.equal(conservative.appliedPreference, false);
assert.equal(conservative.effectiveIiRate, 12.6);
assert.ok(conservative.warnings.some(x => x.includes("TEC/II normal")));

const applied = resolveMercosurEuImportPreference({
  date:"2026-11-01", ncm:"32081010", originCountry:"Alemanha", standardIiRate:12.6,
  preferenceRequested:true, originProofConfirmed:true, preferentialIiRate:11.3, quotaRequired:false
});
assert.equal(applied.appliedPreference, true);
assert.equal(applied.effectiveIiRate, 11.3);

const missingProof = resolveMercosurEuImportPreference({
  date:"2026-11-01", ncm:"32081010", originCountry:"Alemanha", standardIiRate:12.6,
  preferenceRequested:true, originProofConfirmed:false, preferentialIiRate:11.3
});
assert.equal(missingProof.appliedPreference, false);
assert.equal(missingProof.effectiveIiRate, 12.6);

console.log("Mercosur-EU import preference guardrail passed.");
