import assert from "node:assert/strict";
import fs from "node:fs";
import { resolveDefenseCommercial } from "../lib/defesa-comercial-resolver.ts";
import { findDefenseCommercialMeasure, listDefenseCommercialExporters } from "../lib/defesa-comercial-p0-registry.ts";

const date = "2026-09-11";

for (const scenario of [
  { ncm: "73259100", origin: "Índia", customsValueBrl: 100000, rate: 4.69, amount: 4690 },
  { ncm: "76061190", origin: "China", customsValueBrl: 100000, rate: 14.93, amount: 14930 },
  { ncm: "72193300", origin: "Indonésia", customsValueBrl: 100000, rate: 18.79, amount: 18790 },
]) {
  const result = resolveDefenseCommercial({ ...scenario, importDate: date, exchangeRate: 5.5 });
  assert.equal(result.status, "identified", `${scenario.ncm}/${scenario.origin} must resolve`);
  assert.equal(result.measure, "countervailing");
  assert.equal(result.unit, "AD_VALOREM");
  assert.equal(result.rate, scenario.rate);
  assert(Math.abs(Number(result.amountBrl) - scenario.amount) < 0.01);
  assert.match(result.sourceUrl ?? "", /gov\.br\/mdic/);
}

const aluminumSpecific = resolveDefenseCommercial({
  ncm: "76061190",
  origin: "China",
  importDate: date,
  customsValueBrl: 100000,
  exchangeRate: 5.5,
  exporter: "Neuman (Xinhui) Alloy Materials Co., Ltd. Neuman Holding (Hong Kong) Ltd.",
});
assert.equal(aluminumSpecific.rate, 14.88);
assert(Math.abs(Number(aluminumSpecific.amountBrl) - 14880) < 0.01);

for (const scenario of [
  { ncm: "29153931", origin: "Estados Unidos da América", expected: /4 litros|escopo/i },
  { ncm: "20041000", origin: "Alemanha", expected: /escopo|exclus/i },
  { ncm: "29181400", origin: "China", expected: /compromisso de preço|preço CIF|preco CIF/i },
]) {
  const result = resolveDefenseCommercial({ ncm: scenario.ncm, origin: scenario.origin, importDate: date, customsValueBrl: 100000, exchangeRate: 5.5, weightKg: 1000 });
  assert.equal(result.status, "requires_input", `${scenario.ncm}/${scenario.origin} must fail closed`);
  assert.equal(result.amountBrl, undefined);
  assert.ok(result.warnings.some((warning) => scenario.expected.test(warning)), result.warnings.join(" | "));
}

const usButanol = findDefenseCommercialMeasure("29051300", "Estados Unidos da América", date);
const zaButanol = findDefenseCommercialMeasure("29051300", "África do Sul", date);
assert(usButanol, "US n-Butanol measure must exist");
assert(zaButanol, "South Africa n-Butanol measure must exist");
assert.notEqual(usButanol.sourceUrl, zaButanol.sourceUrl, "n-Butanol official sources must remain separated by origin group");
assert.match(usButanol.sourceUrl ?? "", /n-butanol/);
assert.match(zaButanol.sourceUrl ?? "", /n-butanol/);

const ambiguous = resolveDefenseCommercial({ ncm: "73041900", origin: "China", importDate: date, weightKg: 1000, exchangeRate: 5.5, customsValueBrl: 100000 });
assert.equal(ambiguous.status, "requires_input", "overlapping official scopes must not produce an automatic amount");
assert.equal(ambiguous.amountBrl, undefined);

const suspended = resolveDefenseCommercial({ ncm: "40112090", origin: "Japão", importDate: date, weightKg: 1000, exchangeRate: 5.5, customsValueBrl: 100000 });
assert.equal(suspended.collectionSuspended, true);
assert.equal(suspended.amountBrl, undefined);
assert.equal(suspended.status, "requires_input");

const api = fs.readFileSync("app/api/defesa-comercial-options/route.ts", "utf8");
const resolver = fs.readFileSync("lib/defesa-comercial-resolver.ts", "utf8");
const catalog = fs.readFileSync("lib/defesa-comercial-catalog.ts", "utf8");
assert.match(api, /defesa-comercial-p0-registry/);
assert.match(resolver, /defesa-comercial-p0-registry/);
assert.match(catalog, /"antidumping" \| "countervailing"/);
assert.match(catalog, /requiresScopeValidation/);
assert.match(catalog, /scopeCondition/);

const options = listDefenseCommercialExporters("73259100", "Índia", date);
assert.equal(options?.measure.measure, "countervailing");
assert.equal(options?.options.length, 2);

console.log("Defense commercial P0 launch gate: OK — countervailing, scope, price undertaking, suspension and ambiguity fail-closed semantics locked");
