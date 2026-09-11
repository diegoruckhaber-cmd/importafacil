import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveFederalTaxes } from '../lib/federal-tax-resolution.ts';

const root = process.cwd();
const alertsPath = path.join(root, 'data', 'federal', 'temporary-ii-alerts-2026.json');
const alerts = JSON.parse(fs.readFileSync(alertsPath, 'utf8'));

assert(Array.isArray(alerts), 'temporary II catalog must be an array');
assert(alerts.length > 0, 'temporary II catalog must not be empty');

for (const [index, item] of alerts.entries()) {
  assert.match(item.ncm, /^\d{8}$/, `row ${index}: NCM must contain 8 digits`);
  assert(Number.isFinite(item.temporaryRate) && item.temporaryRate >= 0 && item.temporaryRate < 100, `row ${index}: temporaryRate invalid`);
  assert.match(item.validFrom, /^\d{4}-\d{2}-\d{2}$/, `row ${index}: validFrom invalid`);
  assert.match(item.validTo, /^\d{4}-\d{2}-\d{2}$/, `row ${index}: validTo invalid`);
  assert(item.validFrom <= item.validTo, `row ${index}: validity window inverted`);
  assert(typeof item.legalBasis === 'string' && item.legalBasis.trim().length > 0, `row ${index}: legal basis required`);
  assert(typeof item.description === 'string' && item.description.trim().length > 0, `row ${index}: description required`);
}

const ncm28353920 = alerts.find((item) => item.ncm === '28353920');
assert(ncm28353920, 'NCM 28353920 temporary measure must exist');
assert.equal(ncm28353920.temporaryRate, 17.5);
assert.equal(ncm28353920.validFrom, '2026-01-19');
assert.equal(ncm28353920.validTo, '2027-01-18');
assert.match(ncm28353920.legalBasis, /845\/2026/);

// Production behavior is validated through the canonical federal resolver.
// No parallel "resolveLikeProduction" algorithm is allowed in this test.
const before = resolveFederalTaxes({ ncm: '28353920', date: '2026-01-18' });
const firstDay = resolveFederalTaxes({ ncm: '28353920', date: '2026-01-19' });
const lastDay = resolveFederalTaxes({ ncm: '28353920', date: '2027-01-18' });
const after = resolveFederalTaxes({ ncm: '28353920', date: '2027-01-19' });

assert.equal(before.ii.status, 'resolved', 'base II must resolve before the temporary treatment starts');
assert.equal(before.iiRate, 9, 'base II for NCM 28353920 must be 9% before the temporary treatment');
assert.equal(firstDay.ii.status, 'resolved');
assert.equal(firstDay.iiRate, 17.5, 'temporary DCC rate must apply on the first day');
assert.equal(lastDay.iiRate, 17.5, 'temporary DCC rate must apply on the last day');
assert.equal(after.iiRate, 9, 'base II must resume after temporary treatment expiry');

const grouped = new Map();
for (const item of alerts) {
  const list = grouped.get(item.ncm) ?? [];
  list.push(item);
  grouped.set(item.ncm, list);
}
for (const [ncm, items] of grouped.entries()) {
  if (items.length > 1) {
    const descriptions = new Set(items.map((item) => item.description));
    assert(descriptions.size === items.length, `${ncm}: duplicate temporary measures need distinct descriptions (e.g. Ex/quota)`);
  }
}

console.log(`temporary II audit OK: ${alerts.length} catalog rows validated through canonical resolver`);
