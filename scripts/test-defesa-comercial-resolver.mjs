import assert from "node:assert/strict";
import { resolveDefenseCommercial } from "../lib/defesa-comercial-resolver.ts";
import { listDefenseCommercialExporters } from "../lib/defesa-comercial-registry.ts";

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
assert.equal(chinaResidual?.options.length, 28);
assert.equal(chinaResidual?.options.at(-1)?.rate, 2.59);

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

console.log("Defense commercial resolver/catalog: OK");
