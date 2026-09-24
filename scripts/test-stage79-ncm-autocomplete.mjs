import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/simulacao-v2/page.tsx", "utf8");
const component = fs.readFileSync("app/components/NcmAutocomplete.tsx", "utf8");
const route = fs.readFileSync("app/api/ncm-search/route.ts", "utf8");

assert.match(page, /import NcmAutocomplete/);
assert.match(page, /<NcmAutocomplete/);
assert.doesNotMatch(page, /<Text label="NCM \(8 dígitos\)"/);

assert.match(component, /\/api\/ncm-search\?q=/);
assert.match(component, /role="combobox"/);
assert.match(component, /role="listbox"/);
assert.match(component, /ArrowDown/);
assert.match(component, /ArrowUp/);
assert.match(component, /Buscando NCMs/);
assert.match(component, /Digite ao menos 2 números/);

assert.match(route, /row\.normalizedCode\.length === 8/);
assert.match(route, /row\.normalizedCode\.startsWith\(normalizedQuery\)/);
assert.doesNotMatch(route, /normalizedCode\.includes\(normalizedQuery\)/);

console.log("Stage 79 NCM autocomplete regression passed.");
