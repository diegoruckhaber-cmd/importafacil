import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveDefenseCommercial } from "../lib/defesa-comercial-resolver.ts";

const AUDIT_DATE = "2026-09-02";
const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "defesa-comercial-mdic.json"), "utf8"));

function toIso(value) {
  const match = String(value ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : undefined;
}

const continuationSources = new Set([
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/tubos-de-coleta-de-sangue",
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/pneus-de-carga",
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/pneus-de-carga-china",
]);

const inactive = new Set([
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/tubos-de-coleta-de-sangue|alemanha",
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/laminados-planos-de-baixo-carbono-e-baixa-liga-chapas-grossas|africa do sul",
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/pneus-de-carga|china",
]);

let guarded = 0;
for (const measure of catalog) {
  const expiry = toIso(measure.validUntil);
  if (!expiry || expiry >= AUDIT_DATE || continuationSources.has(measure.sourceUrl)) continue;
  for (const rawOrigin of measure.origins ?? []) {
    const originKey = String(rawOrigin).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (inactive.has(`${measure.sourceUrl}|${originKey}`)) continue;
    const entry = Object.entries(measure.exportersByOrigin ?? {}).find(([key]) => key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === originKey);
    const options = entry?.[1] ?? [];
    if (!options.length) continue;

    const resolution = resolveDefenseCommercial({
      ncm: measure.ncm,
      origin: rawOrigin,
      importDate: AUDIT_DATE,
      exporter: options[0].exporter,
      weightKg: 1000,
      quantity: 1000,
      areaM2: 100,
      customsValueBrl: 100000,
      exchangeRate: 5.5,
    });

    assert.notEqual(resolution.status, "identified", `${measure.product}/${rawOrigin}: medida nominalmente expirada não pode calcular automaticamente sem continuidade auditada`);
    assert.equal(resolution.amountBrl, undefined, `${measure.product}/${rawOrigin}: medida nominalmente expirada não pode gerar valor automático`);
    assert.ok(resolution.warnings.some((warning) => /vigência nominal registrada terminou/i.test(warning) || /mais de um escopo/i.test(warning)), `${measure.product}/${rawOrigin}: deve explicar bloqueio de vigência ou escopo`);
    guarded += 1;
  }
}
assert.ok(guarded > 0, "auditoria deve cobrir ao menos uma medida nominalmente expirada com matriz resolvida");

const cargoTireChina = resolveDefenseCommercial({ ncm: "40112090", origin: "China", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5, exporter: "Shandong Linglong Tyre Co., Ltd." });
assert.equal(cargoTireChina.status, "identified", "pneu de carga China deve continuar calculável durante revisão auditada");
assert.equal(cargoTireChina.continuationAfterNominalExpiry, true);
assert.ok(cargoTireChina.warnings.some((warning) => /continuidade da medida durante revisão/i.test(warning)));

const bloodTubesChina = resolveDefenseCommercial({ ncm: "38221990", origin: "China", importDate: AUDIT_DATE, quantity: 1000, customsValueBrl: 100000, exchangeRate: 5.5 });
assert.notEqual(bloodTubesChina.status, "not_applicable", "tubos de coleta / China permanecem identificados durante revisão final");
assert.equal(bloodTubesChina.continuationAfterNominalExpiry, true);
assert.ok(bloodTubesChina.warnings.some((warning) => /continuidade da medida durante revisão/i.test(warning)));

console.log(`defense-commercial validity guard: OK (${guarded} nominal-expiry scenarios blocked)`);
