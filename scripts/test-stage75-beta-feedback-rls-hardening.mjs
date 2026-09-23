import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260923090000_harden_beta_feedback_rls.sql", "utf8");
const api = fs.readFileSync("app/api/beta-feedback/route.ts", "utf8");

assert.match(migration, /revoke all on table public\.beta_feedback from public, anon, authenticated/);
assert.match(migration, /grant select, insert, delete on table public\.beta_feedback to authenticated/);
assert.doesNotMatch(migration, /grant[^;]*update[^;]*to authenticated/i);
assert.doesNotMatch(migration, /grant[^;]*truncate[^;]*to authenticated/i);
assert.match(migration, /\(select auth\.uid\(\)\) = user_id/g);

assert.match(api, /export async function POST/);
assert.match(api, /export async function GET/);
assert.match(api, /export async function DELETE/);
assert.doesNotMatch(api, /export async function PUT/);
assert.doesNotMatch(api, /export async function PATCH/);

console.log("Stage 75 beta feedback RLS hardening regression passed.");
