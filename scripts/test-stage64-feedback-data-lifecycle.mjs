import assert from "node:assert/strict";
import fs from "node:fs";

const migration=fs.readFileSync("supabase/migrations/20260918_beta_feedback_user_delete_stage64.sql","utf8");
assert.match(migration,/grant delete on table public\.beta_feedback to authenticated/);
assert.match(migration,/create policy beta_feedback_delete_own/);
assert.match(migration,/for delete/);
assert.match(migration,/auth\.uid\(\) = user_id/);

const api=fs.readFileSync("app/api/beta-feedback/route.ts","utf8");
assert.match(api,/export async function DELETE/);
assert.match(api,/Identificador de feedback inválido/);
assert.match(api,/\.delete\(\)/);
assert.match(api,/\.eq\("id", id\)/);
assert.match(api,/\.eq\("user_id", user\.id\)/);
assert.match(api,/Feedback não encontrado/);
assert.match(api,/mode: "delete"/);

const page=fs.readFileSync("app/feedback/page.tsx","utf8");
assert.match(page,/removeFeedback/);
assert.match(page,/method: "DELETE"/);
assert.match(page,/Excluir este feedback da sua conta\?/);
assert.match(page,/Feedback excluído da sua conta/);
assert.match(page,/deletingId===row\.id/);

const doc=fs.readFileSync("docs/stage64-feedback-data-lifecycle.md","utf8");
assert.match(doc,/delete only their own feedback records/i);
assert.match(doc,/RLS remains enabled/i);
assert.match(doc,/No fiscal rule, billing logic or release scope changes/i);

console.log("Stage 64 feedback data lifecycle regression passed.");
