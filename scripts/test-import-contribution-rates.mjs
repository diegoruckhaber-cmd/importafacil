import assert from "node:assert/strict";
import { resolveImportContributionRates } from "../lib/import-contribution-rates.ts";

const tires = resolveImportContributionRates("40112090");
assert.equal(tires.pisImportRate, 2.68);
assert.equal(tires.cofinsImportRate, 12.35);
assert.match(tires.source, /40\.11/);

const tubes = resolveImportContributionRates("40139000");
assert.equal(tubes.pisImportRate, 2.68);
assert.equal(tubes.cofinsImportRate, 12.35);

const general = resolveImportContributionRates("32081020");
assert.equal(general.pisImportRate, 2.1);
assert.equal(general.cofinsImportRate, 9.65);

console.log("PASS: NCM-specific PIS/Cofins-Importação resolution");
