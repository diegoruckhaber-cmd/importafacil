import assert from "node:assert/strict";
import { resolveFederalTaxes } from "../lib/federal-tax-resolution.ts";

const result = resolveFederalTaxes({ ncm: "3208.10.20", date: "2026-08-15" });
assert.equal(result.iiRate, 12.6);
assert.equal(result.ipiRate, 3.25);
assert.equal(result.automatic.ii, true);
assert.equal(result.automatic.ipi, true);
assert.equal(result.automatic.pisImport, true);
assert.equal(result.cofinsImportRate, 0.965);

const unknown = resolveFederalTaxes({ ncm: "9999.99.99", date: "2026-08-15" });
assert.equal(unknown.iiRate, null);
assert.equal(unknown.ipiRate, null);
assert.equal(unknown.automatic.ii, false);
assert.equal(unknown.automatic.ipi, false);
assert.ok(unknown.warnings.length >= 2);

console.log("Federal NCM automatic resolution acceptance: OK");
