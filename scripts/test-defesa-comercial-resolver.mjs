import assert from "node:assert/strict";
import { resolveDefenseCommercial } from "../lib/defesa-comercial-resolver.ts";
import { findDefenseCommercialMeasure, listDefenseCommercialExporters, listMatchingDefenseCommercialScopes } from "../lib/defesa-comercial-registry.ts";

const pending = resolveDefenseCommercial({ ncm: "40112090", origin: "China", importDate: "2026-08-17" });
assert.equal(pending.status, "requires_input");
assert.equal(pending.measure, "antidumping");
assert.equal(pending.unit, "USD_PER_KG");
assert.equal(pending.rateUsdPerKg, 2.59);
assert.ok(pending.warnings.some((warning) => warning.includes("peso líquido")));

const calculated = resolveDefenseCommercial({ ncm: "40112090", origin: "China", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5 });
assert.equal(calculated.status, "identified");
assert.equal(calculated.amountBrl, 14245);

const specific = resolveDefenseCommercial({ ncm: "40112090", origin: "China", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5, exporter: "Shandong Linglong Tyre Co., Ltd." });
assert.equal(specific.rateUsdPerKg, 1.05);
assert.equal(specific.amountBrl, 5775);

const triangle = resolveDefenseCommercial({ ncm: "40112090", origin: "China", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5, exporter: "Triangle Tyre Co., Ltd." });
assert.equal(triangle.rateUsdPerKg, 1.07);
assert.equal(triangle.amountBrl, 5885);

const chinaResidual = listDefenseCommercialExporters("40112090", "China", "2026-08-17");
assert.ok(chinaResidual && chinaResidual.options.some((option) => option.rate === 2.59 && option.unit === "USD_PER_KG"));

const korea = resolveDefenseCommercial({ ncm: "40112090", origin: "Coreia do Sul", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5, exporter: "Kumho Tires Co. Inc." });
assert.equal(korea.rateUsdPerKg, 0.32);
assert.equal(korea.amountBrl, 1760);

const russia = resolveDefenseCommercial({ ncm: "40112090", origin: "Rússia", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5, exporter: "OAO Cordiant" });
assert.equal(russia.rateUsdPerKg, 1.10);
assert.equal(russia.amountBrl, 6050);

const thailand = resolveDefenseCommercial({ ncm: "40112090", origin: "Tailândia", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5, exporter: "Zhongce Rubber Co. Ltd" });
assert.equal(thailand.rateUsdPerKg, 0.55);
assert.equal(thailand.amountBrl, 3025);

const japan = resolveDefenseCommercial({ ncm: "40112090", origin: "Japão", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5, exporter: "Sumitomo Rubber Industries" });
assert.equal(japan.collectionSuspended, true);
assert.equal(japan.amountBrl, undefined);
assert.ok(japan.warnings.some((warning) => warning.includes("suspensa")));

const otherOrigin = resolveDefenseCommercial({ ncm: "40112090", origin: "México", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5 });
assert.equal(otherOrigin.status, "not_applicable");

const butanol = listDefenseCommercialExporters("29051300", "Estados Unidos da América", "2026-08-17");
assert.ok(butanol);
assert.ok((butanol?.options.length ?? 0) >= 5);
assert.ok(butanol?.options.some((option) => option.rate === 9.8 && option.unit === "AD_VALOREM"));

const sappCanada = listDefenseCommercialExporters("28353920", "Canadá", "2026-08-28");
assert.ok(sappCanada);
assert.deepEqual(sappCanada?.options, [
  { exporter: "Innophos Canada Inc.", rate: 546.3, unit: "USD_PER_TON", collectionSuspended: false },
  { exporter: "Demais", rate: 1066.3, unit: "USD_PER_TON", collectionSuspended: false },
]);
const sappSpecific = resolveDefenseCommercial({ ncm: "28353920", origin: "Canadá", importDate: "2026-08-28", weightKg: 10000, exchangeRate: 5.5, exporter: "Innophos Canada Inc." });
assert.equal(sappSpecific.status, "identified");
assert.equal(sappSpecific.amountBrl, 30046.5);

const lisina = listDefenseCommercialExporters("23099090", "China", "2026-08-28");
assert.ok(lisina);
assert.ok((lisina?.options.length ?? 0) >= 17);
const lisinaSpecific = resolveDefenseCommercial({ ncm: "23099090", origin: "China", importDate: "2026-08-28", customsValueBrl: 100000, exchangeRate: 5.5, exporter: "Qiqihar Longjiang Fufeng Biotechnologies Co., Ltd." });
assert.equal(lisinaSpecific.amountBrl, 41300);

for (const scenario of [
  { ncm: "70071900", origin: "China" },
  { ncm: "72107010", origin: "China" },
  { ncm: "73041900", origin: "China" },
]) {
  const scopes = listMatchingDefenseCommercialScopes(scenario.ncm, scenario.origin);
  assert.ok(scopes.length >= 2);
  const ambiguous = listDefenseCommercialExporters(scenario.ncm, scenario.origin, "2026-09-02");
  assert.ok(ambiguous?.ambiguous);
  assert.equal(ambiguous?.options.length, 0);
  const resolution = resolveDefenseCommercial({ ncm: scenario.ncm, origin: scenario.origin, importDate: "2026-09-02", weightKg: 1000, areaM2: 1000, customsValueBrl: 100000, exchangeRate: 5.5 });
  assert.equal(resolution.status, "requires_input");
  assert.equal(resolution.amountBrl, undefined);
  assert.ok(resolution.warnings.some((warning) => /mais de um escopo/i.test(warning)));
}

const bloodTubesGermany = resolveDefenseCommercial({ ncm: "38221990", origin: "Alemanha", importDate: "2026-09-02", customsValueBrl: 100000, exchangeRate: 5.5 });
assert.equal(bloodTubesGermany.status, "not_applicable");
const plateSouthAfrica = resolveDefenseCommercial({ ncm: "72085100", origin: "África do Sul", importDate: "2026-09-02", weightKg: 1000, exchangeRate: 5.5 });
assert.equal(plateSouthAfrica.status, "not_applicable");

// Continuidade pós-vigência nominal deve vir do catálogo auditado, nunca de heurística.
const offsetUk = findDefenseCommercialMeasure("37013021", "Reino Unido", "2026-09-02");
assert.equal(offsetUk?.continuationAfterNominalExpiry, true);
const incompleteResolution = resolveDefenseCommercial({ ncm: "37013021", origin: "Reino Unido", importDate: "2026-09-02", exchangeRate: 5.5 });
assert.equal(incompleteResolution.status, "requires_input");
assert.equal(incompleteResolution.amountBrl, undefined);
assert.ok(incompleteResolution.warnings.some((warning) => /continuidade da medida durante revisão/i.test(warning)));
assert.ok(incompleteResolution.warnings.some((warning) => /matriz de produtor\/exportador/i.test(warning)));

// Renovações auditadas substituem a vigência nominal antiga sem depender do crawler defasado.
const padlock = findDefenseCommercialMeasure("83011000", "China", "2026-09-02");
assert.ok(padlock, "Cadeados/China deve existir no catálogo");
assert.equal(padlock?.validUntil, "24/10/2030");
assert.equal(padlock?.continuationAfterNominalExpiry, false);

const coldLineGlass = findDefenseCommercialMeasure("70071900", "China", "2026-09-02");
const coldLineScope = coldLineGlass?.matchingScopes?.find((scope) => /linha fria/i.test(scope.product));
if (coldLineScope) assert.equal(coldLineScope.validUntil, "24/06/2031");

console.log("Defense commercial resolver/catalog: OK");
