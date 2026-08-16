import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'importafacil-'));
const input = join(dir, 'sample.xlsx');
const output = join(dir, 'catalog.json');

// The transformer itself is exercised in CI against real workbooks. This contract test
// intentionally verifies the publication requirements without fabricating a production catalog.
writeFileSync(input, 'not-a-workbook');

let failed = false;
try {
  execFileSync('python', ['scripts/transform-federal-tariff-workbook.py', input, output], { stdio: 'pipe' });
} catch (error) {
  failed = true;
}
assert.equal(failed, true, 'invalid workbook must never produce a catalog');

console.log('federal workbook publication guard: ok');
