import assert from "node:assert/strict";
import { resolveFederalTaxes } from "../lib/federal-tax-resolution.ts";

const normal = resolveFederalTaxes({ date: "2026-03-31", statutoryIIRate: 12, ipiRate: 5 });
assert.equal(normal.pisImportRate, 2.1);
assert.equal(normal.cofinsImportRate, 9.65);
assert.equal(normal.iiRate, 12);
assert.equal(normal.ipiRate, 5);

const reduced = resolveFederalTaxes({ date: "2026-04-01", cofinsReducedBenefit: true, cofinsAdditional060: false });
assert.equal(reduced.cofinsImportRate, 0.965);
assert.equal(reduced.cofinsDisplayRate, 0.97);
assert.equal(reduced.iiRate, null);
assert.equal(reduced.ipiRate, null);
assert.ok(reduced.warnings.some((w) => w.includes("II")));
assert.ok(reduced.warnings.some((w) => w.includes("IPI")));

const additional = resolveFederalTaxes({ date: "2026-04-01", cofinsReducedBenefit: true, cofinsAdditional060: true });
assert.equal(additional.cofinsImportRate, 1.565);
assert.equal(additional.cofinsDisplayRate, 1.57);

console.log("PASS: federal tax resolution acceptance");
