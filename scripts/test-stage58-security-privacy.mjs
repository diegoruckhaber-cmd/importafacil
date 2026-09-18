import assert from "node:assert/strict";
import fs from "node:fs";

const simulations=fs.readFileSync("app/api/simulations/route.ts","utf8");
assert.match(simulations,/NEXT_PUBLIC_SUPABASE_URL/);
assert.match(simulations,/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
assert.match(simulations,/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
assert.match(simulations,/Autenticação do ambiente não está configurada/);
assert.doesNotMatch(simulations,/\.supabase\.co"/);
assert.doesNotMatch(simulations,/sb_publishable_/);

const config=fs.readFileSync("next.config.ts","utf8");
for(const header of ["X-Content-Type-Options","X-Frame-Options","Referrer-Policy","Permissions-Policy","Cross-Origin-Opener-Policy"]){
  assert.ok(config.includes(header),"missing security header "+header);
}
assert.match(config,/poweredByHeader:\s*false/);
assert.doesNotMatch(config,/Content-Security-Policy"/);

const webhook=fs.readFileSync("app/api/stripe/webhook/route.ts","utf8");
assert.doesNotMatch(webhook,/auditError instanceof Error/);
assert.match(webhook,/audit_update_failed/);

const privacy=fs.readFileSync("app/privacidade/page.tsx","utf8");
const terms=fs.readFileSync("app/termos/page.tsx","utf8");
assert.match(privacy,/Stripe/);
assert.match(privacy,/Supabase/);
assert.match(privacy,/Telemetria operacional/);
assert.match(terms,/general_rate_only/);
assert.match(terms,/Fail-closed/);
assert.match(terms,/abertura comercial irrestrita/);

const home=fs.readFileSync("app/page.tsx","utf8");
assert.match(home,/href="\/privacidade"/);
assert.match(home,/href="\/termos"/);

const sitemap=fs.readFileSync("app/sitemap.ts","utf8");
assert.match(sitemap,/\/privacidade/);
assert.match(sitemap,/\/termos/);

console.log("Stage 58 security and privacy regression passed.");
