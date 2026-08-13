import assert from "node:assert/strict";
import { calculateTributaryOperation } from "../lib/tributary-engine.ts";

const base = {
  valorAduaneiro: 100000,
  iiRate: 10,
  ipiRate: 5,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsRate: 17,
  importDate: "2026-04-01",
};

const normal = calculateTributaryOperation(base);
assert.equal(normal.ii.rate, 0.1);
assert.equal(normal.ii.payable, 10000);

const reducedII = calculateTributaryOperation({
  ...base,
  iiBenefitKind: "reduced_rate",
  iiReducedRate: 4,
  iiCoveredByLC224: true,
  iiLegalFoundation: "TEST-REDUCED-II",
});
assert.equal(reducedII.ii.rate, 0.046);
assert.equal(reducedII.ii.payable, 4600);
assert.equal(reducedII.federal2026?.ii?.treatment, "benefit_10pct_reduction");

const exemptII = calculateTributaryOperation({
  ...base,
  iiBenefitKind: "exemption",
  iiCoveredByLC224: true,
  iiLegalFoundation: "TEST-EXEMPT-II",
});
assert.equal(exemptII.ii.payable, 1000);
assert.equal(exemptII.federal2026?.ii?.treatment, "benefit_10pct_reduction");

const exceptionII = calculateTributaryOperation({
  ...base,
  iiBenefitKind: "exemption",
  iiCoveredByLC224: true,
  iiExceptionToLC224: true,
  iiLegalFoundation: "TEST-EXCEPTION",
});
assert.equal(exceptionII.ii.payable, 0);
assert.equal(exceptionII.federal2026?.ii?.treatment, "exemption");

const suspendedII = calculateTributaryOperation({
  ...base,
  iiBenefitKind: "suspension",
  iiLegalFoundation: "TEST-SUSPENSION",
});
assert.equal(suspendedII.ii.payable, 0);
assert.equal(suspendedII.federal2026?.ii?.treatment, "suspension");

console.log("Federal II 2026 integration: PASS");
