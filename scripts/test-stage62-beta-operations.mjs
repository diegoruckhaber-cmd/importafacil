import assert from "node:assert/strict";
import fs from "node:fs";

const migration=fs.readFileSync("supabase/migrations/20260918_add_beta_feedback_stage62.sql","utf8");
assert.match(migration,/create table if not exists public\.beta_feedback/);
assert.match(migration,/enable row level security/);
assert.match(migration,/revoke all on table public\.beta_feedback from public, anon/);
assert.match(migration,/grant select, insert on table public\.beta_feedback to authenticated/);
assert.match(migration,/auth\.uid\(\) = user_id/);
assert.match(migration,/char_length\(message\) between 10 and 2000/);

const api=fs.readFileSync("app/api/beta-feedback/route.ts","utf8");
assert.match(api,/auth\.getUser/);
assert.match(api,/CATEGORIES/);
assert.match(api,/message\.length < 10 \|\| message\.length > 2000/);
assert.match(api,/\.from\("beta_feedback"\)/);
assert.match(api,/event: "beta\.feedback"/);
assert.doesNotMatch(api,/console\.(log|info|warn|error)\([^\n]*message/);

const telemetry=fs.readFileSync("lib/operational-observability.ts","utf8");
assert.match(telemetry,/\| "beta\.feedback"/);
assert.doesNotMatch(telemetry,/feedbackMessage|userId|email/);

const page=fs.readFileSync("app/feedback/page.tsx","utf8");
assert.match(page,/BETA CONTROLADO/);
assert.match(page,/não é enviado aos logs de telemetria/);
assert.match(page,/\/api\/beta-feedback/);
assert.match(page,/maxLength=\{2000\}/);

const dashboard=fs.readFileSync("app/dashboard/page.tsx","utf8");
assert.match(dashboard,/Enviar feedback/);
assert.match(dashboard,/\/feedback\?from=\/dashboard/);

const doc=fs.readFileSync("docs/stage62-beta-operations.md","utf8");
assert.match(doc,/does \*\*not\*\* assert that a target number of external users has participated/i);
assert.match(doc,/does \*\*not\*\*.*unrestricted commercial release/i);

console.log("Stage 62 controlled beta operations regression passed.");
