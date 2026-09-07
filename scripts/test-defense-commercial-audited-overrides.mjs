import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { listDefenseCommercialExporters } from "../lib/defesa-comercial-registry.ts";
import { resolveDefenseCommercial } from "../lib/defesa-comercial-resolver.ts";

const closeTo = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
const audit = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "defesa-comercial-audited-overrides-2026.json"), "utf8"));
assert.equal(audit.version, 1);
assert.equal(audit.auditedAt, "2026-09-07");
assert.equal(audit.entries.length, 8);
for (const entry of audit.entries) {
  assert.ok(entry.sourceUrl?.includes("gov.br/mdic"), `${entry.product}: fonte oficial obrigatória`);
  assert.ok(entry.legalFoundation, `${entry.product}: fundamento legal obrigatório`);
  for (const rows of Object.values(entry.exportersByOrigin ?? {})) {
    assert.ok(rows.length > 0, `${entry.product}: matriz auditada não pode estar vazia`);
    for (const row of rows) {
      assert.ok(Number.isFinite(row.rate) && row.rate >= 0, `${entry.product}: direito inválido`);
      assert.ok(["USD_PER_KG", "USD_PER_TON", "AD_VALOREM", "USD_PER_UNIT", "USD_PER_THOUSAND_UNITS"].includes(row.unit), `${entry.product}: unidade inválida`);
    }
  }
}

const keysChina = resolveDefenseCommercial({ ncm:"83017000", origin:"China", importDate:"2026-09-07", weightKg:100, exchangeRate:5.5 });
assert.equal(keysChina.status,"identified"); closeTo(keysChina.amountBrl,13513.5);
const padlocks = resolveDefenseCommercial({ ncm:"83011000", origin:"China", importDate:"2026-09-07", weightKg:100, exchangeRate:5.5 });
assert.equal(padlocks.rate,10.11); closeTo(padlocks.amountBrl,5560.5);
const pet = resolveDefenseCommercial({ ncm:"39076100", origin:"Malásia", importDate:"2026-09-07", weightKg:10000, exchangeRate:5.5, exporter:"Recron (Malaysia) Sdn Bhd." });
assert.equal(pet.rate,24.28); closeTo(pet.amountBrl,1335.4);

for (const [origin, rate] of [["Alemanha",241.16],["China",321.05],["Estados Unidos",150.45],["França",184.63],["Itália",201.98]]) {
  const r = resolveDefenseCommercial({ncm:"29171210",origin,importDate:"2026-09-07",weightKg:1000,exchangeRate:5.5});
  assert.equal(r.status,"identified"); assert.equal(r.rate,rate); assert.equal(r.unit,"USD_PER_TON"); closeTo(r.amountBrl,rate*5.5);
}
const mirrorChina = resolveDefenseCommercial({ncm:"70099100",origin:"China",importDate:"2026-09-07",weightKg:1000,exchangeRate:5.5});
assert.equal(mirrorChina.rate,211.98); closeTo(mirrorChina.amountBrl,1165.89);
const mirrorMexico = resolveDefenseCommercial({ncm:"70099100",origin:"México",importDate:"2026-09-07",weightKg:1000,exchangeRate:5.5});
assert.equal(mirrorMexico.collectionSuspended,true); closeTo(mirrorMexico.amountBrl,0);

const butanolUs = resolveDefenseCommercial({ncm:"29051300",origin:"Estados Unidos",importDate:"2026-09-07",customsValueBrl:100000,exchangeRate:5.5,exporter:"Oxea Corporation"});
assert.equal(butanolUs.rate,9.8); assert.equal(butanolUs.unit,"AD_VALOREM"); closeTo(butanolUs.amountBrl,9800);
const butanolRussia = resolveDefenseCommercial({ncm:"29051300",origin:"Rússia",importDate:"2026-09-07",customsValueBrl:100000,exchangeRate:5.5});
assert.equal(butanolRussia.rate,54.7); closeTo(butanolRussia.amountBrl,54700);

const estersUs = listDefenseCommercialExporters("29153931","Estados Unidos","2026-09-07");
assert.ok(estersUs && !estersUs.ambiguous && estersUs.options.some(x=>x.exporter==="The Dow Chemical Company" && x.rate===148.17));
const estersMexico = resolveDefenseCommercial({ncm:"29153100",origin:"México",importDate:"2026-09-07",weightKg:1000,exchangeRate:5.5});
assert.equal(estersMexico.rate,647.94); closeTo(estersMexico.amountBrl,3563.67);

const potatoesGermany = resolveDefenseCommercial({ncm:"20041000",origin:"Alemanha",importDate:"2026-09-07",customsValueBrl:100000,exchangeRate:5.5,exporter:"Wernsing Feinkost GMBH"});
assert.equal(potatoesGermany.rate,6.3); closeTo(potatoesGermany.amountBrl,6300);
const potatoesBelgium = resolveDefenseCommercial({ncm:"20041000",origin:"Bélgica",importDate:"2026-09-07",customsValueBrl:100000,exchangeRate:5.5,exporter:"Agristo NV"});
assert.equal(potatoesBelgium.rate,9.4); closeTo(potatoesBelgium.amountBrl,9400);
const potatoesNl = resolveDefenseCommercial({ncm:"20041000",origin:"Países Baixos",importDate:"2026-09-07",customsValueBrl:100000,exchangeRate:5.5,exporter:"Agristo BV"});
assert.equal(potatoesNl.rate,0); closeTo(potatoesNl.amountBrl,0);

console.log("defense-commercial audited MDIC overrides: OK");
