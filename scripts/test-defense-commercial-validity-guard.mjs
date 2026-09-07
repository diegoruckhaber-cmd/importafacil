import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveDefenseCommercial } from "../lib/defesa-comercial-resolver.ts";

const AUDIT_DATE = "2026-09-02";
const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "defesa-comercial-mdic.json"), "utf8"));
const validityAudit = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "defesa-comercial-validity-audit-2026.json"), "utf8"));

function toIso(value) {
  const match = String(value ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : undefined;
}

const allowedDispositions = new Set(["continuation_review", "renewed"]);
const auditedActiveSources = new Set();
const catalogSources = new Set(catalog.map((measure) => measure.sourceUrl).filter(Boolean));

assert.equal(validityAudit.version, 1, "catálogo de vigência auditada deve usar schema v1");
assert.ok(Array.isArray(validityAudit.entries) && validityAudit.entries.length > 0, "catálogo de vigência auditada não pode estar vazio");

for (const entry of validityAudit.entries) {
  assert.ok(typeof entry.sourceUrl === "string" && entry.sourceUrl.includes("gov.br/mdic"), `${entry.product}: fonte de vigência deve ser oficial do MDIC`);
  assert.ok(catalogSources.has(entry.sourceUrl), `${entry.product}: fonte auditada deve existir no catálogo MDIC versionado`);
  assert.ok(allowedDispositions.has(entry.disposition), `${entry.product}: disposition inválida`);
  assert.ok(toIso(entry.nominalValidUntil), `${entry.product}: nominalValidUntil inválido`);
  assert.ok(typeof entry.legalBasis === "string" && entry.legalBasis.trim().length > 0, `${entry.product}: fundamento jurídico obrigatório`);

  if (entry.disposition === "renewed") {
    const nominal = toIso(entry.nominalValidUntil);
    const effective = toIso(entry.effectiveValidUntil);
    assert.ok(effective, `${entry.product}: renovação requer effectiveValidUntil válido`);
    assert.ok(effective > nominal, `${entry.product}: nova vigência deve superar a vigência nominal anterior`);
  } else {
    assert.equal(entry.effectiveValidUntil, undefined, `${entry.product}: revisão em curso não deve inventar nova data final`);
  }

  auditedActiveSources.add(entry.sourceUrl);
}

const inactive = new Set([
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/tubos-de-coleta-de-sangue|alemanha",
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/laminados-planos-de-baixo-carbono-e-baixa-liga-chapas-grossas|africa do sul",
  "https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/pneus-de-carga|china",
]);

let guarded = 0;
let unauditedResolvableExpired = 0;
for (const measure of catalog) {
  const expiry = toIso(measure.validUntil);
  if (!expiry || expiry >= AUDIT_DATE || auditedActiveSources.has(measure.sourceUrl)) continue;
  for (const rawOrigin of measure.origins ?? []) {
    const originKey = String(rawOrigin).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (inactive.has(`${measure.sourceUrl}|${originKey}`)) continue;
    const entry = Object.entries(measure.exportersByOrigin ?? {}).find(([key]) => key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === originKey);
    const options = entry?.[1] ?? [];
    if (!options.length) continue;
    unauditedResolvableExpired += 1;

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
assert.equal(guarded, unauditedResolvableExpired, "toda medida nominalmente expirada, resolvível e não auditada deve ser bloqueada");

const cargoTireChina = resolveDefenseCommercial({ ncm: "40112090", origin: "China", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5, exporter: "Shandong Linglong Tyre Co., Ltd." });
assert.equal(cargoTireChina.status, "identified", "pneu de carga China deve continuar calculável durante revisão auditada");
assert.equal(cargoTireChina.continuationAfterNominalExpiry, true);
assert.ok(cargoTireChina.warnings.some((warning) => /continuidade da medida durante revisão/i.test(warning)));

const cargoTireKorea = resolveDefenseCommercial({ ncm: "40112090", origin: "Coreia do Sul", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5, exporter: "Kumho Tires Co. Inc." });
assert.equal(cargoTireKorea.status, "identified", "Coreia do Sul deve permanecer ativa durante revisão auditada");
assert.equal(cargoTireKorea.continuationAfterNominalExpiry, true);
assert.equal(cargoTireKorea.collectionSuspended, false);
assert.ok(cargoTireKorea.warnings.some((warning) => /continuidade da medida durante revisão/i.test(warning)));

const cargoTireJapan = resolveDefenseCommercial({ ncm: "40112090", origin: "Japão", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5, exporter: "Sumitomo Rubber Industries" });
assert.equal(cargoTireJapan.collectionSuspended, true, "suspensão auditada deve permanecer restrita ao Japão");
assert.equal(cargoTireJapan.amountBrl, undefined);

const padlocks = resolveDefenseCommercial({ ncm: "83011000", origin: "China", importDate: AUDIT_DATE, weightKg: 1000, quantity: 1000, customsValueBrl: 100000, exchangeRate: 5.5 });
assert.equal(padlocks.validUntil, "24/10/2030", "cadeados deve usar a vigência renovada auditada");
assert.ok(!padlocks.warnings.some((warning) => /vigência nominal registrada terminou/i.test(warning)), "cadeados renovados não podem ser bloqueados pela data antiga do crawler");

const coldLineGlass = resolveDefenseCommercial({ ncm: "70071900", origin: "China", importDate: AUDIT_DATE, areaM2: 100, customsValueBrl: 100000, exchangeRate: 5.5 });
assert.ok(!coldLineGlass.warnings.some((warning) => /vigência nominal registrada terminou/i.test(warning)), "vidros de linha fria renovados não podem ser tratados como expirados");
assert.equal(coldLineGlass.status, "requires_input", "NCM 70071900 continua bloqueada por ambiguidade material de escopo");

console.log(`defense-commercial validity guard: OK (${guarded} unaudited nominal-expiry scenarios blocked; ${validityAudit.entries.length} audited dispositions validated)`);
