import assert from "node:assert/strict";
import {
  FEDERAL_TARIFF_CATALOG_STATUS,
  FEDERAL_TARIFF_SOURCE_LAYERS,
  getFederalTariffSourcePriority,
} from "../lib/federal-tariff-source-manifest-2026.ts";

assert.equal(FEDERAL_TARIFF_CATALOG_STATUS.productionReady, false);
assert.equal(getFederalTariffSourcePriority("TEC"), 100);
assert.ok(getFederalTariffSourcePriority("LETEC") > getFederalTariffSourcePriority("TEC"));
assert.ok(getFederalTariffSourcePriority("EX_TARIFARIO") > getFederalTariffSourcePriority("LETEC"));
assert.equal(new Set(FEDERAL_TARIFF_SOURCE_LAYERS.map((item) => item.key)).size, FEDERAL_TARIFF_SOURCE_LAYERS.length);

console.log("Federal tariff source manifest acceptance: OK");
