import assert from "node:assert/strict";
import fs from "node:fs";
import { buildDashboardInsights, filterDashboardRecords } from "../lib/dashboard-insights.ts";

const rows = [
  { id:"1", name:"SP base", created_at:"2026-09-18T10:00:00Z", input:{destinationUf:"SP"}, result:{contract:"importafacil-simulation-v2",status:"calculated",summary:{landedCostBrl:1000}} },
  { id:"2", name:"SC alerta", created_at:"2026-09-18T09:00:00Z", input:{destinationUf:"SC"}, result:{contract:"importafacil-simulation-v2",status:"alert",summary:{landedCostBrl:1200}} },
  { id:"3", name:"MA pendente", created_at:"2026-09-18T08:00:00Z", input:{destinationUf:"MA"}, result:{contract:"importafacil-simulation-v2",status:"requires_input",summary:null} },
];

const insights = buildDashboardInsights(rows);
assert.equal(insights.totalSaved,3);
assert.equal(insights.v2Count,3);
assert.equal(insights.attentionCount,2);
assert.equal(insights.calculatedCount,1);
assert.equal(insights.latestCostBrl,1000);
assert.equal(insights.latestV2Id,"1");

assert.deepEqual(filterDashboardRecords(rows,{status:"alert"}).map(x=>x.id),["2"]);
assert.deepEqual(filterDashboardRecords(rows,{query:"ma"}).map(x=>x.id),["3"]);
assert.deepEqual(filterDashboardRecords(rows,{query:"SC alerta"}).map(x=>x.id),["2"]);

const page=fs.readFileSync("app/dashboard/page.tsx","utf8");
assert.match(page,/Painel de simulações/);
assert.match(page,/Pontos de atenção/);
assert.match(page,/Último custo salvo/);
assert.match(page,/Status V2/);
assert.match(page,/Relatório mais recente/);
assert.match(page,/Nenhum tributo é recalculado/);
assert.match(page,/items\.slice\(0, 3\)/);

console.log("Stage 56 PRO dashboard regression passed.");
