import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/simulacao-v2/page.tsx", "utf8");
const country = fs.readFileSync("app/components/CountryAutocomplete.tsx", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260924165000_verified_free_quota.sql", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");

assert.match(page, /import CountryAutocomplete/);
assert.match(page, /<CountryAutocomplete/);
assert.doesNotMatch(page, /<Text label="País de origem"/);

assert.match(country, /Intl\.DisplayNames/);
assert.match(country, /role="combobox"/);
assert.match(country, /role="listbox"/);
assert.match(country, /ArrowDown/);
assert.match(country, /ArrowUp/);

assert.match(migration, /server_execution is not null/);
assert.doesNotMatch(migration, /where s\.user_id=p_user_id\) >= 3/);
assert.match(migration, /simulation_limit_reached/);

assert.match(page, /className="financialHighlights"/);
assert.match(page, /className="costBreakdown"/);
assert.match(page, /className="resultTableWrap"/);
assert.match(page, /className="attentionList"/);
assert.match(page, /renderAttentionPoint/);
assert.match(page, /const \[saveMessage, setSaveMessage\]/);
assert.match(page, /className="saveError"/);

assert.match(css, /\.financialHighlights/);
assert.match(css, /\.resultTable/);
assert.match(css, /\.attentionItem/);
assert.match(css, /\.countryOptions/);
assert.match(css, /\.saveError/);

console.log("Stage 80 origin, FREE quota and result UX regression passed.");
