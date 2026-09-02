import { spawnSync } from 'node:child_process';

const tests = [
  'test:engine',
  'test:federal-2026',
  'test:federal-ii-2026',
  'test:federal-tax-resolution',
  'test:mercosul-eu-ii',
  'test:federal-tariff-catalog',
  'test:federal-ncm-auto',
  'test:federal-tariff-sources',
  'test:tipi-source',
  'test:federal-workbook-contract',
  'test:legal-foundation-2026',
  'test:defesa-comercial',
  'test:item-tributary-expenses',
  'test:item-sc-benefit',
  'test:sc-multi-item-final-cost',
  'test:sc-import-icms-ttd',
  'test:sc-ttd-2026',
  'test:sc-ttd-integration',
  'test:sc-special-regimes',
  'test:sc-special-regime-api',
  'test:sc-treatment-discovery',
  'test:sc-import-additional-charges',
  'test:golden-import',
  'test:final-cost-memory',
  'test:mvp-sc-operation',
  'test:sc-federal-live',
  'test:import-scenario-comparator',
  'test:import-scenario-legal-memory',
  'test:import-scenario-recommendation',
  'test:tax-profile-sale-context',
  'test:temporary-ii',
  'test:audit-core',
];

const failures = [];
const startedAt = Date.now();
for (const name of tests) {
  console.log(`\n=== ${name} ===`);
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(command, ['run', name], { stdio: 'inherit', shell: false });
  if (result.status !== 0) failures.push(name);
}

const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`\nFull audit completed in ${elapsedSeconds}s. ${tests.length - failures.length}/${tests.length} suites passed.`);
if (failures.length) {
  console.error(`Failed suites: ${failures.join(', ')}`);
  process.exit(1);
}
