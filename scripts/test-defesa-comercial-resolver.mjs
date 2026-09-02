import assert from "node:assert/strict";
import { resolveDefenseCommercial } from "../lib/defesa-comercial-resolver.ts";
import { listDefenseCommercialExporters, listMatchingDefenseCommercialScopes } from "../lib/defesa-comercial-registry.ts";

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
assert.ok(butanol, "n-Butanol / EUA deve encontrar medida antidumping");
assert.ok((butanol?.options.length ?? 0) >= 5, "n-Butanol / EUA deve listar produtores/exportadores");
assert.ok(butanol?.options.some((option) => option.rate === 9.8 && option.unit === "AD_VALOREM"));

const sappCanada = listDefenseCommercialExporters("28353920", "Canadá", "2026-08-28");
assert.ok(sappCanada, "SAPP / Canadá deve encontrar medida antidumping");
assert.deepEqual(sappCanada?.options, [
  { exporter: "Innophos Canada Inc.", rate: 546.3, unit: "USD_PER_TON", collectionSuspended: false },
  { exporter: "Demais", rate: 1066.3, unit: "USD_PER_TON", collectionSuspended: false },
]);

const sappSpecific = resolveDefenseCommercial({ ncm: "28353920", origin: "Canadá", importDate: "2026-08-28", weightKg: 10000, exchangeRate: 5.5, exporter: "Innophos Canada Inc." });
assert.equal(sappSpecific.status, "identified");
assert.equal(sappSpecific.unit, "USD_PER_TON");
assert.equal(sappSpecific.amountBrl, 30046.5);

const sappOther = resolveDefenseCommercial({ ncm: "28353920", origin: "Canadá", importDate: "2026-08-28", weightKg: 10000, exchangeRate: 5.5, exporter: "Demais" });
assert.equal(sappOther.amountBrl, 58646.5);

const sappUsa = listDefenseCommercialExporters("28353920", "Estados Unidos", "2026-08-28");
assert.ok(sappUsa, "SAPP / EUA deve encontrar medida antidumping por alias de origem");
assert.deepEqual(sappUsa?.options, [
  { exporter: "Innophos Inc.", rate: 418.13, unit: "USD_PER_TON", collectionSuspended: false },
  { exporter: "Prayon Inc.", rate: 734.28, unit: "USD_PER_TON", collectionSuspended: false },
  { exporter: "Demais", rate: 734.28, unit: "USD_PER_TON", collectionSuspended: false },
]);

const lisina = listDefenseCommercialExporters("23099090", "China", "2026-08-28");
assert.ok(lisina, "Lisina / China deve encontrar medida antidumping");
assert.ok((lisina?.options.length ?? 0) >= 17, "Lisina deve trazer todas as linhas de produtor/exportador");
assert.ok(lisina?.options.some((option) => option.rate === 78 && option.unit === "AD_VALOREM"));
assert.ok(lisina?.options.some((option) => option.rate === 132.6 && /Demais empresas chinesas/i.test(option.exporter)));

const lisinaSpecific = resolveDefenseCommercial({ ncm: "23099090", origin: "China", importDate: "2026-08-28", customsValueBrl: 100000, exchangeRate: 5.5, exporter: "Qiqihar Longjiang Fufeng Biotechnologies Co., Ltd." });
assert.equal(lisinaSpecific.status, "identified");
assert.equal(lisinaSpecific.unit, "AD_VALOREM");
assert.equal(lisinaSpecific.amountBrl, 41300);

for (const scenario of [
  { ncm: "70071900", origin: "China" },
  { ncm: "72107010", origin: "China" },
  { ncm: "73041900", origin: "China" },
]) {
  const scopes = listMatchingDefenseCommercialScopes(scenario.ncm, scenario.origin);
  assert.ok(scopes.length >= 2, `${scenario.ncm}/${scenario.origin} deve manter múltiplos escopos identificados`);
  const ambiguous = listDefenseCommercialExporters(scenario.ncm, scenario.origin, "2026-09-02");
  assert.ok(ambiguous?.ambiguous, `${scenario.ncm}/${scenario.origin} deve ser marcado como ambíguo`);
  assert.equal(ambiguous?.options.length, 0, "matrizes de escopos distintos não podem ser mescladas");
  const resolution = resolveDefenseCommercial({ ncm: scenario.ncm, origin: scenario.origin, importDate: "2026-09-02", weightKg: 1000, areaM2: 1000, customsValueBrl: 100000, exchangeRate: 5.5 });
  assert.equal(resolution.status, "requires_input");
  assert.equal(resolution.exporterTreatment, "requires_validation");
  assert.equal(resolution.amountBrl, undefined);
  assert.ok(resolution.warnings.some((warning) => /mais de um escopo/i.test(warning)));
}

const bloodTubesGermany = resolveDefenseCommercial({ ncm: "38221990", origin: "Alemanha", importDate: "2026-09-02", customsValueBrl: 100000, exchangeRate: 5.5 });
assert.equal(bloodTubesGermany.status, "not_applicable");
const plateSouthAfrica = resolveDefenseCommercial({ ncm: "72085100", origin: "África do Sul", importDate: "2026-09-02", weightKg: 1000, exchangeRate: 5.5 });
assert.equal(plateSouthAfrica.status, "not_applicable");

const incompleteExporterMatrix = listDefenseCommercialExporters("37013021", "Reino Unido", "2026-09-02");
assert.ok(incompleteExporterMatrix, "Chapas off-set / Reino Unido deve continuar identificando a medida oficial");
assert.equal(incompleteExporterMatrix?.options.length, 0, "cenário de regressão depende de matriz ainda incompleta");

const incompleteResolution = resolveDefenseCommercial({ ncm: "37013021", origin: "Reino Unido", importDate: "2026-09-02", exchangeRate: 5.5 });
assert.equal(incompleteResolution.status, "requires_input");
assert.equal(incompleteResolution.measure, "antidumping");
assert.equal(incompleteResolution.exporterTreatment, "requires_validation");
assert.equal(incompleteResolution.amountBrl, undefined);
assert.ok(incompleteResolution.sourceUrl?.includes("gov.br/mdic"));
assert.ok(incompleteResolution.warnings.some((warning) => /vigência nominal registrada terminou/i.test(warning) || /matriz de produtor\/exportador/i.test(warning)));

console.log("Defense commercial resolver/catalog: OK");
