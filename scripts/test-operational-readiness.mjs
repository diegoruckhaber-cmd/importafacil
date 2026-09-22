import assert from 'node:assert/strict';
import { assessAuditRun, newestFederalWorkbook, newestTipiUpdate, getOperationalReadiness } from '../lib/operational-readiness.ts';

const now=Date.parse('2026-09-22T12:00:00Z');
const success={status:'completed',conclusion:'success',updated_at:'2026-09-22T10:00:00Z'};
assert.equal(assessAuditRun(success,48,now),'passed');
assert.equal(assessAuditRun({...success,conclusion:'failure'},48,now),'failed');
assert.equal(assessAuditRun({...success,status:'in_progress'},48,now),'pending');
assert.equal(assessAuditRun({...success,updated_at:'2026-09-01T00:00:00Z'},48,now),'stale');
assert.equal(assessAuditRun(undefined,48,now),'unknown');

assert.equal(
  newestFederalWorkbook('08-09-2026-anexos-i-a-x-resolucao-gecex-272-21.xlsx 22-09-2026-anexos-i-a-x-resolucao-gecex-272-21.xlsx'),
  '2026-09-22',
);
assert.equal(newestTipiUpdate('<p>Atualizado em 13/02/2026 15h18</p>'),'2026-02-13');
assert.equal(newestTipiUpdate('<p>Tipi.xlsx — última modificação 14/03/2026 10h00</p>'),'2026-03-14');
assert.equal(newestTipiUpdate('<p>sem data reconhecível</p>'),null);

global.fetch=async()=>{throw new Error('offline')};
const unavailable=await getOperationalReadiness();
assert.equal(unavailable.status,'blocked');
assert(unavailable.blockers.includes('audit_mdic_unknown'));
assert(unavailable.blockers.includes('tipi_source_unknown'));
assert.equal(unavailable.federalSource.status,'unknown');
assert.equal(unavailable.tipiSource.status,'unknown');

console.log('Operational readiness fails closed for failed, stale and missing audit/source evidence, including live TIPI freshness.');
