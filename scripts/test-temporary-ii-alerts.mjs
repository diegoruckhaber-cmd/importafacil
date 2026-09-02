import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const alertsPath = path.join(root, 'data', 'federal', 'temporary-ii-alerts-2026.json');
const snapshotPath = path.join(root, 'data', 'federal', 'official-snapshot-2026-07.json');

const alerts = JSON.parse(fs.readFileSync(alertsPath, 'utf8'));
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

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

const standardII = snapshot.records.find((row) => String(row.ncm).replace(/\D/g, '') === '28353920' && row.sourceType === 'mdic-ii');
assert(standardII, 'NCM 28353920 must exist in the official II snapshot');
assert.equal(standardII.rate, 9, 'standard II snapshot for 28353920 must remain 9%');
assert(ncm28353920.temporaryRate > standardII.rate, 'temporary rate must be above the standard rate for the tested alert');

function resolveLikeProduction(ncm, date, standardRate) {
  const matches = alerts.filter((item) => item.ncm === ncm && item.validFrom <= date && date <= item.validTo && item.temporaryRate > standardRate);
  if (!matches.length) return undefined;
  return matches.sort((a, b) => b.temporaryRate - a.temporaryRate)[0];
}

assert.equal(resolveLikeProduction('28353920', '2026-01-18', 9), undefined, 'alert must not fire before validity');
assert.equal(resolveLikeProduction('28353920', '2026-01-19', 9)?.temporaryRate, 17.5, 'alert must fire on first day');
assert.equal(resolveLikeProduction('28353920', '2027-01-18', 9)?.temporaryRate, 17.5, 'alert must fire on last day');
assert.equal(resolveLikeProduction('28353920', '2027-01-19', 9), undefined, 'alert must not fire after validity');

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

console.log(`temporary II audit OK: ${alerts.length} catalog rows validated`);
