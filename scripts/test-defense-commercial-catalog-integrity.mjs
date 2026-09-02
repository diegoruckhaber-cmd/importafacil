import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const catalogPath = path.join(process.cwd(), "data", "defesa-comercial-mdic.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const AUDIT_DATE = "2026-09-02";
const UNITS = new Set([
  "AD_VALOREM",
  "USD_PER_KG",
  "USD_PER_TON",
  "USD_PER_THOUSAND_UNITS",
  "USD_PER_PAIR",
  "USD_PER_UNIT",
  "USD_PER_SQUARE_METER",
]);

const normalize = (value = "") => String(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\*,:;]+$/g, "").trim();
const toIso = (value) => {
  const m = String(value ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : iso;
};

assert.ok(Array.isArray(catalog), "defense-commercial catalog must be an array");
assert.ok(catalog.length >= 40, `defense-commercial catalog unexpectedly small: ${catalog.length}`);

const issues = [];
const unresolvedOrigins = [];
const numericExporterRows = [];
const expiredNominally = [];
const overlapMap = new Map();

for (const [index, measure] of catalog.entries()) {
  const prefix = `measure[${index}] ${measure?.product ?? "<unknown>"}`;
  if (!measure || typeof measure !== "object") {
    issues.push(`${prefix}: invalid object`);
    continue;
  }

  const ncmPatterns = Array.isArray(measure.ncmPatterns) && measure.ncmPatterns.length ? measure.ncmPatterns : [measure.ncm];
  for (const pattern of ncmPatterns) {
    if (!/^\d{4}(?:\d{2})?(?:\d{2})?$/.test(String(pattern ?? ""))) issues.push(`${prefix}: invalid NCM pattern ${pattern}`);
  }
  if (!Array.isArray(measure.origins) || measure.origins.length === 0) issues.push(`${prefix}: missing origins`);
  if (measure.sourceUrl && !/^https:\/\/www\.gov\.br\/mdic\//.test(measure.sourceUrl)) issues.push(`${prefix}: non-MDIC sourceUrl ${measure.sourceUrl}`);
  if (measure.validUntil && !toIso(measure.validUntil)) issues.push(`${prefix}: invalid validUntil ${measure.validUntil}`);
  if (!measure.exportersByOrigin || typeof measure.exportersByOrigin !== "object") issues.push(`${prefix}: missing exportersByOrigin`);

  const normalizedOrigins = (measure.origins ?? []).map(normalize);
  if (new Set(normalizedOrigins).size !== normalizedOrigins.length) issues.push(`${prefix}: duplicate normalized origins`);

  for (const rawOrigin of measure.origins ?? []) {
    const origin = normalize(rawOrigin);
    const entry = Object.entries(measure.exportersByOrigin ?? {}).find(([key]) => normalize(key) === origin);
    const options = entry?.[1] ?? [];
    if (!Array.isArray(options) || options.length === 0) unresolvedOrigins.push({ ncm: measure.ncm, product: measure.product, origin: rawOrigin, sourceUrl: measure.sourceUrl });

    for (const option of Array.isArray(options) ? options : []) {
      const exporter = String(option?.exporter ?? "").trim();
      if (!exporter) issues.push(`${prefix}/${rawOrigin}: empty exporter`);
      if (/^[0-9.,]+$/.test(exporter)) numericExporterRows.push({ ncm: measure.ncm, product: measure.product, origin: rawOrigin, exporter, rate: option?.rate, sourceUrl: measure.sourceUrl });
      if (!Number.isFinite(option?.rate) || option.rate < 0) issues.push(`${prefix}/${rawOrigin}/${exporter}: invalid rate ${option?.rate}`);
      if (!UNITS.has(option?.unit)) issues.push(`${prefix}/${rawOrigin}/${exporter}: invalid unit ${option?.unit}`);
      if (typeof option?.collectionSuspended !== "boolean") issues.push(`${prefix}/${rawOrigin}/${exporter}: collectionSuspended must be boolean`);
    }

    for (const pattern of ncmPatterns) {
      const key = `${pattern}|${origin}`;
      const rows = overlapMap.get(key) ?? [];
      rows.push({ product: measure.product, sourceUrl: measure.sourceUrl, options: Array.isArray(options) ? options.length : 0, validUntil: measure.validUntil });
      overlapMap.set(key, rows);
    }
  }

  const expiryIso = toIso(measure.validUntil);
  if (expiryIso && expiryIso < AUDIT_DATE && !/\*|revis[aã]o|em vigor por for[cç]a/i.test(String(measure.validityNote ?? ""))) {
    expiredNominally.push({ ncm: measure.ncm, product: measure.product, validUntil: measure.validUntil, sourceUrl: measure.sourceUrl });
  }
}

const overlaps = [...overlapMap.entries()]
  .filter(([, rows]) => rows.length > 1)
  .map(([key, rows]) => ({ key, rows }));

assert.deepEqual(issues, [], `defense-commercial structural integrity failed:\n${issues.join("\n")}`);

console.log(JSON.stringify({
  auditDate: AUDIT_DATE,
  measures: catalog.length,
  unresolvedOriginCount: unresolvedOrigins.length,
  numericExporterRowCount: numericExporterRows.length,
  nominallyExpiredCount: expiredNominally.length,
  overlappingNcmOriginCount: overlaps.length,
  unresolvedOrigins,
  numericExporterRows,
  expiredNominally,
  overlaps,
}, null, 2));
console.log("defense-commercial catalog structural integrity: OK");
