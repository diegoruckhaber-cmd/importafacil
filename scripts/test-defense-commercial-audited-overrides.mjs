import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { listDefenseCommercialExporters } from "../lib/defesa-comercial-registry.ts";
import { resolveDefenseCommercial } from "../lib/defesa-comercial-resolver.ts";

const closeTo = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);

const audit = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "defesa-comercial-audited-overrides-2026.json"), "utf8"));
assert.equal(audit.version, 1);
assert.equal(audit.auditedAt, "2026-09-07");
assert.equal(audit.entries.length, 3);
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

const keysChina = listDefenseCommercialExporters("83017000", "China", "2026-09-07");
assert.ok(keysChina && !keysChina.ambiguous);
assert.ok(keysChina.options.some((x) => x.exporter === "Todos os produtores/exportadores" && x.rate === 24.57 && x.unit === "USD_PER_KG"));
const keysChinaCalc = resolveDefenseCommercial({ ncm: "83017000", origin: "China", importDate: "2026-09-07", weightKg: 100, exchangeRate: 5.5 });
assert.equal(keysChinaCalc.status, "identified");
closeTo(keysChinaCalc.amountBrl, 13513.5);

const keysColombia = resolveDefenseCommercial({ ncm: "83017000", origin: "Colômbia", importDate: "2026-09-07", weightKg: 100, exchangeRate: 5.5, exporter: "Silca South America S.A." });
assert.equal(keysColombia.status, "identified");
assert.equal(keysColombia.rate, 1.25);
closeTo(keysColombia.amountBrl, 687.5);
const keysPeruResidual = resolveDefenseCommercial({ ncm: "83017000", origin: "Peru", importDate: "2026-09-07", weightKg: 100, exchangeRate: 5.5 });
assert.equal(keysPeruResidual.rate, 8.88);
closeTo(keysPeruResidual.amountBrl, 4884);

const padlocks = resolveDefenseCommercial({ ncm: "83011000", origin: "China", importDate: "2026-09-07", weightKg: 100, exchangeRate: 5.5 });
assert.equal(padlocks.status, "identified");
assert.equal(padlocks.rate, 10.11);
assert.equal(padlocks.unit, "USD_PER_KG");
closeTo(padlocks.amountBrl, 5560.5);
assert.equal(padlocks.validUntil, "24/10/2030");

const petMalaysiaSpecific = resolveDefenseCommercial({ ncm: "39076100", origin: "Malásia", importDate: "2026-09-07", weightKg: 10000, exchangeRate: 5.5, exporter: "Recron (Malaysia) Sdn Bhd." });
assert.equal(petMalaysiaSpecific.status, "identified");
assert.equal(petMalaysiaSpecific.rate, 24.28);
assert.equal(petMalaysiaSpecific.unit, "USD_PER_TON");
closeTo(petMalaysiaSpecific.amountBrl, 1335.4);
const petMalaysiaResidual = resolveDefenseCommercial({ ncm: "39076100", origin: "Malásia", importDate: "2026-09-07", weightKg: 10000, exchangeRate: 5.5 });
assert.equal(petMalaysiaResidual.rate, 116.5);
closeTo(petMalaysiaResidual.amountBrl, 6407.5);
const petVietnam = resolveDefenseCommercial({ ncm: "39076100", origin: "Vietnã", importDate: "2026-09-07", weightKg: 10000, exchangeRate: 5.5 });
assert.equal(petVietnam.status, "identified");
assert.equal(petVietnam.rate, 160.87);
closeTo(petVietnam.amountBrl, 8847.85);
assert.equal(petVietnam.validUntil, "04/09/2031");

console.log("defense-commercial audited MDIC overrides: OK");
