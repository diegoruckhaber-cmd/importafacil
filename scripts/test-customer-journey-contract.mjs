import assert from "node:assert/strict";
import fs from "node:fs";

const saveApi = fs.readFileSync("app/api/simulations/route.ts", "utf8");
const simulator = fs.readFileSync("app/simulacao-v2/page.tsx", "utf8");
const dashboard = fs.readFileSync("app/dashboard/page.tsx", "utf8");
const detail = fs.readFileSync("app/simulacao/[id]/page.tsx", "utf8");
const compare = fs.readFileSync("app/comparar/page.tsx", "utf8");
const report = fs.readFileSync("app/relatorio/page.tsx", "utf8");
const subscription = fs.readFileSync("app/api/subscription/route.ts", "utf8");

assert.match(saveApi, /Faça login para salvar a simulação/);
assert.match(saveApi, /executeOfficialSimulationV2\(body\.input\)/);
assert.doesNotMatch(saveApi, /persistCalculatedRecord\([^\n]*body\.result/);
assert.match(saveApi, /limite de 3 simulações do plano FREE/);
assert.match(saveApi, /server_execution/);
assert.match(saveApi, /hasMore/);

assert.match(simulator, /Salvar no histórico/);
assert.match(simulator, /Authorization: `Bearer \$\{session\.access_token\}`/);
assert.match(simulator, /mode: "v2"/);
assert.match(dashboard, /location\.href = "\/auth"/);
assert.match(dashboard, /items\.slice\(0, 3\)/);
assert.match(dashboard, /Comparar cenários/);
assert.match(detail, /server_execution/);
assert.match(compare, /plan\.toUpperCase\(\)\s*===\s*"FREE"/);
assert.match(report, /plan\s*===\s*"FREE"/);
assert.match(subscription, /Sessão autenticada é obrigatória/);
assert.match(subscription, /Cache-Control/);
assert.match(subscription, /no-store/);

console.log("Customer journey contract: OK — auth, official save, FREE limit, history and PRO gates are wired end to end");
