import assert from "node:assert/strict";
import { supabaseAdminHeaders, supabaseElevatedKeyKind } from "../lib/supabase-admin.ts";

const modern = "sb_secret_abcdefghijklmnopqrstuvwxyz0123456789";
assert.equal(supabaseElevatedKeyKind(modern), "secret");
assert.deepEqual(supabaseAdminHeaders(modern), { apikey: modern });

const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
const servicePayload = Buffer.from(JSON.stringify({ role: "service_role", exp: 4_000_000_000 })).toString("base64url");
const legacy = `${header}.${servicePayload}.signature`;
assert.equal(supabaseElevatedKeyKind(legacy), "legacy_service_role");
assert.deepEqual(supabaseAdminHeaders(legacy), { apikey: legacy, Authorization: `Bearer ${legacy}` });

const anonPayload = Buffer.from(JSON.stringify({ role: "anon", exp: 4_000_000_000 })).toString("base64url");
const anon = `${header}.${anonPayload}.signature`;
assert.equal(supabaseElevatedKeyKind(anon), "invalid");
assert.throws(() => supabaseAdminHeaders(anon), /not configured correctly/);
assert.equal(supabaseElevatedKeyKind("sb_publishable_public"), "invalid");

console.log("Stage 47 Supabase admin: OK — modern sb_secret keys use apikey-only semantics and legacy service_role remains compatible");
