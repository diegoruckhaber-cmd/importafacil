import assert from "node:assert/strict";
import { normalizeFederalTariffRows, resolveFederalTariff } from "../lib/federal-tariff-catalog.ts";
import { FEDERAL_TARIFF_2026_SMOKE_SEED } from "../lib/federal-tariff-catalog-2026-seed.ts";

const catalog = normalizeFederalTariffRows([
  {
    ncm: "3208.10.20",
    rate: 14,
    source: "TEC",
    validFrom: "2026-01-01",
    legalBasis: "TEC vigente",
    priority: 100,
  },
  {
    ncm: "3208.10.20",
    rate: 10,
    source: "LETEC",
    validFrom: "2026-06-01",
    legalBasis: "Resolução Gecex — exemplo de exceção versionada",
    priority: 200,
  },
]);

const exception = resolveFederalTariff({ ncm: "3208.10.20", date: "2026-07-01", catalog });
assert.equal(exception.rate, 10);
assert.equal(exception.source, "LETEC");
assert.equal(exception.automatic, true);

const base = resolveFederalTariff({ ncm: "3208.10.20", date: "2026-03-01", catalog });
assert.equal(base.rate, 14);
assert.equal(base.source, "TEC");

const missing = resolveFederalTariff({ ncm: "9999.99.99", date: "2026-07-01", catalog });
assert.equal(missing.rate, null);
assert.equal(missing.automatic, false);

const ambiguousCatalog = normalizeFederalTariffRows([
  {
    ncm: "1234.56.78",
    rate: 5,
    source: "TEC",
    validFrom: "2026-01-01",
    legalBasis: "TEC",
    priority: 100,
  },
  {
    ncm: "1234.56.78",
    rate: 7,
    source: "OMC",
    validFrom: "2026-01-01",
    legalBasis: "Outra base",
    priority: 100,
  },
]);
const ambiguous = resolveFederalTariff({ ncm: "1234.56.78", date: "2026-07-01", catalog: ambiguousCatalog });
assert.equal(ambiguous.rate, null);
assert.equal(ambiguous.automatic, false);

const realSeed = resolveFederalTariff({
  ncm: "3208.10.20",
  date: "2026-08-15",
  catalog: FEDERAL_TARIFF_2026_SMOKE_SEED,
});
assert.equal(realSeed.rate, 12.6);
assert.equal(realSeed.source, "TEC");
assert.equal(realSeed.automatic, true);

console.log("Federal tariff catalog acceptance: OK");
