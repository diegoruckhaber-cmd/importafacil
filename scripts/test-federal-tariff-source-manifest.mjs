import assert from "node:assert/strict";
import {
  FEDERAL_TARIFF_CATALOG_STATUS,
  FEDERAL_TARIFF_SOURCE_LAYERS,
  FEDERAL_TARIFF_SOURCE_MANIFEST_VERSION,
  getFederalTariffSourcePriority,
} from "../lib/federal-tariff-source-manifest-2026.ts";

assert.equal(FEDERAL_TARIFF_SOURCE_MANIFEST_VERSION, "2026-09-08");
assert.equal(FEDERAL_TARIFF_CATALOG_STATUS.productionReady, true);
assert.equal(FEDERAL_TARIFF_CATALOG_STATUS.schemaVersion, 4);
assert.equal(FEDERAL_TARIFF_CATALOG_STATUS.snapshot, "data/federal/official-snapshot-2026-09-08.json");
assert.equal(getFederalTariffSourcePriority("TEC"), 100);
assert.ok(getFederalTariffSourcePriority("LETEC") > getFederalTariffSourcePriority("TEC"));
assert.ok(getFederalTariffSourcePriority("EX_TARIFARIO") > getFederalTariffSourcePriority("LETEC"));
assert.equal(new Set(FEDERAL_TARIFF_SOURCE_LAYERS.map((item) => item.key)).size, FEDERAL_TARIFF_SOURCE_LAYERS.length);

console.log("Federal tariff source manifest acceptance: OK");
