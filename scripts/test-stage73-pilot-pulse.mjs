import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260922203000_add_pilot_pulse.sql", "utf8");
const api = fs.readFileSync("app/api/pilot-pulse/route.ts", "utf8");
const page = fs.readFileSync("app/pilot/page.tsx", "utf8");
const dashboard = fs.readFileSync("app/dashboard/page.tsx", "utf8");

assert.match(migration, /create table if not exists public\.pilot_responses/);
assert.match(migration, /enable row level security/);
assert.match(migration, /\(select auth\.uid\(\)\) = user_id/g);
assert.match(migration, /revoke all on table public\.pilot_responses from anon, authenticated/);\nassert.match(migration, /grant select, insert, update, delete on table public\.pilot_responses to authenticated/);\nassert.match(migration, /unique \(user_id\)/);
assert.match(migration, /ease_score between 1 and 5/);
assert.match(migration, /confidence_score between 1 and 5/);
assert.match(migration, /value_score between 1 and 5/);

assert.match(api, /Faça login para responder ao piloto/);
assert.match(api, /\.from\("pilot_responses"\)/);
assert.match(api, /upsert/);
assert.match(api, /onConflict: "user_id"/);
assert.match(api, /typeof body\?\.wouldPay !== "boolean"/);
assert.match(api, /Cache-Control/);

assert.match(page, /Facilidade para concluir a simulação/);
assert.match(page, /Confiança no resultado apresentado/);
assert.match(page, /Valor percebido para sua rotina de importação/);
assert.match(page, /R\$ 29,90\/mês/);
assert.match(page, /Relatar problema/);
assert.match(dashboard, /href="\/pilot"/);

console.log("Stage 73 pilot pulse contract passed.");
