import assert from "node:assert/strict";
import fs from "node:fs";
import { getRuleHistory, RULE_HISTORY_CONTRACT } from "../lib/rule-history.ts";
import { LEGAL_FOUNDATION_2026 } from "../lib/legal-foundation-registry-2026.ts";

const history = getRuleHistory();
assert.equal(history.contract, RULE_HISTORY_CONTRACT);
assert.equal(history.entries.length, LEGAL_FOUNDATION_2026.length);
assert.ok(history.entries.every((entry) => entry.id && entry.title && entry.officialUrl));
assert.ok(history.federalSnapshot.includes("official-snapshot-2026-09-08.json"));

const implementation = fs.readFileSync("lib/rule-history.ts", "utf8");
const route = fs.readFileSync("app/api/rule-history/route.ts", "utf8");
const page = fs.readFileSync("app/regras/page.tsx", "utf8");
assert.match(implementation, /LEGAL_FOUNDATION_2026\.map/);
assert.doesNotMatch(implementation, /\b(iiRate|ipiRate|pisRate|cofinsRate|icmsRate)\b\s*:/i);
assert.match(route, /export async function GET/);
assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/);
assert.match(page, /somente leitura/i);
assert.match(page, /Abrir fonte oficial/);

console.log("Stage 12 rule history contract: OK");
