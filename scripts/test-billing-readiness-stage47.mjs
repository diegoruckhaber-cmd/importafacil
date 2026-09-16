import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync("app/api/billing-readiness/route.ts", "utf8");
const supabaseAdmin = fs.readFileSync("lib/supabase-admin.ts", "utf8");

for (const required of [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_PRICE_ID",
  "NEXT_PUBLIC_SUPABASE_URL",
]) assert.match(route, new RegExp(required));

assert.match(supabaseAdmin, /SUPABASE_SECRET_KEY/);
assert.match(supabaseAdmin, /SUPABASE_SERVICE_ROLE_KEY/);
assert.match(route, /api\.stripe\.com\/v1\/prices/);
assert.match(route, /livemode === true/);
assert.match(route, /currency === "brl"/);
assert.match(route, /unit_amount === 2990/);
assert.match(route, /recurring\?\.interval === "month"/);
assert.match(route, /checkSupabaseTable\(supabaseUrl, elevatedKey, "profiles"\)/);
assert.match(route, /checkSupabaseTable\(supabaseUrl, elevatedKey, "subscriptions"\)/);
assert.match(route, /supabaseElevatedKeyKind/);
assert.match(route, /status: 503/);
assert.match(route, /Cache-Control/);

for (const forbiddenSecretProperty of [
  /["']stripeSecret["']\s*:/,
  /["']webhookSecret["']\s*:/,
  /["']elevatedKey["']\s*:/,
  /["']STRIPE_SECRET_KEY["']\s*:/,
  /["']STRIPE_WEBHOOK_SECRET["']\s*:/,
  /["']SUPABASE_SECRET_KEY["']\s*:/,
  /["']SUPABASE_SERVICE_ROLE_KEY["']\s*:/,
]) assert.doesNotMatch(route, forbiddenSecretProperty);

console.log("Stage 47 billing readiness: OK — live Stripe config and Supabase elevated-key table reachability are fail-closed without exposing secrets");
