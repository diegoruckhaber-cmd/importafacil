import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const scriptsDir = path.join(process.cwd(), 'scripts');
const tests = fs.readdirSync(scriptsDir)
  .filter((name) => /^test-.*\.mjs$/.test(name))
  .sort();

const failures = [];
const startedAt = Date.now();
for (const file of tests) {
  console.log(`\n=== ${file} ===`);
  const command = process.platform === 'win32' ? 'node_modules/.bin/tsx.cmd' : 'node_modules/.bin/tsx';
  const result = spawnSync(command, [path.join('scripts', file)], {
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) failures.push(file);
}

const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`\nFull audit completed in ${elapsedSeconds}s. ${tests.length - failures.length}/${tests.length} test scripts passed.`);
if (failures.length) {
  console.error(`Failed scripts: ${failures.join(', ')}`);
  process.exit(1);
}
