import assert from "node:assert/strict";
import { resolveCofinsImport2026, resolveFederalRegime } from "../lib/federal-2026-import-rules.ts";

const normal = resolveCofinsImport2026({ date: "2026-03-31", standardRate: 9.65, reducedBenefit: true });
assert.equal(normal.effectiveRate, 9.65);

const reduced = resolveCofinsImport2026({ date: "2026-04-01", standardRate: 9.65, reducedBenefit: true });
assert.equal(reduced.effectiveRate, 0.965);
assert.equal(reduced.displayRate, 0.97);

const reducedPlus = resolveCofinsImport2026({ date: "2026-04-01", standardRate: 9.65, reducedBenefit: true, additional060: true });
assert.equal(reducedPlus.effectiveRate, 1.565);
assert.equal(reducedPlus.displayRate, 1.57);

for (const regime of ["drawback_suspension", "drawback_exemption", "reporto", "retid", "recine"]) {
  const result = resolveFederalRegime(regime);
  assert.equal(result.requiresSpecificLegalBasis, true);
  assert.equal(result.automaticZeroRates, false);
}

console.log("OK: regras federais 2026");
