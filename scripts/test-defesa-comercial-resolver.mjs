import assert from "node:assert/strict";
import { resolveDefenseCommercial } from "../lib/defesa-comercial-resolver.ts";

const pending = resolveDefenseCommercial({ ncm: "40112090", origin: "China", importDate: "2026-08-17" });
assert.equal(pending.status, "requires_input");
assert.equal(pending.measure, "antidumping");
assert.equal(pending.unit, "USD_PER_KG");
assert.equal(pending.rateUsdPerKg, 2.59);
assert.ok(pending.warnings.some((warning) => warning.includes("peso líquido")));

const calculated = resolveDefenseCommercial({ ncm: "40112090", origin: "China", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5 });
assert.equal(calculated.status, "identified");
assert.equal(calculated.amountBrl, 14245);

const specific = resolveDefenseCommercial({ ncm: "40112090", origin: "China", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5, exporter: "Shandong Linglong Tyre Co., Ltd" });
assert.equal(specific.rateUsdPerKg, 1.05);
assert.equal(specific.amountBrl, 5775);

const otherOrigin = resolveDefenseCommercial({ ncm: "40112090", origin: "México", importDate: "2026-08-17", weightKg: 1000, exchangeRate: 5.5 });
assert.equal(otherOrigin.status, "not_applicable");

console.log("Defense commercial resolver: OK");
