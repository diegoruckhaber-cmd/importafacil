import assert from "node:assert/strict";
import fs from "node:fs";

const subscriptionRoute = fs.readFileSync("app/api/subscription/route.ts", "utf8");
assert.doesNotMatch(subscriptionRoute, /not_connected/);
assert.match(subscriptionRoute, /Sessão autenticada é obrigatória/);
assert.match(subscriptionRoute, /from\("profiles"\)/);
assert.match(subscriptionRoute, /from\("subscriptions"\)/);
assert.match(subscriptionRoute, /Cache-Control/);

const migration = fs.readFileSync("supabase/migrations/20260917_harden_billing_rls_and_profile_entitlements.sql", "utf8");
assert.match(migration, /revoke execute on function public\.handle_new_user\(\) from public, anon, authenticated/i);
assert.match(migration, /revoke insert, update, delete, truncate, references, trigger on table public\.profiles from authenticated/i);
assert.match(migration, /grant select on table public\.profiles to authenticated/i);
assert.match(migration, /create policy profiles_select_own[\s\S]*to authenticated[\s\S]*select auth\.uid\(\)/i);
assert.match(migration, /revoke all privileges on table public\.simulations from anon/i);
assert.match(migration, /grant select, insert, update, delete on table public\.simulations to authenticated/i);
assert.match(migration, /revoke insert, update, delete, truncate, references, trigger on table public\.subscriptions from authenticated/i);
assert.match(migration, /grant select on table public\.subscriptions to authenticated/i);

console.log("Stage 47 final security hardening: OK — subscription status is connected and billing entitlements are server-controlled");
