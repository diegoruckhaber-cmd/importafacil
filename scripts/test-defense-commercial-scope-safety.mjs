import assert from "node:assert/strict";
import { resolveDefenseCommercial } from "../lib/defesa-comercial-resolver.ts";
import { listDefenseCommercialExporters } from "../lib/defesa-comercial-registry.ts";

for (const scenario of [
  { ncm:"29153931", origin:"Estados Unidos da América", expected:"4 litros" },
  { ncm:"20041000", origin:"Alemanha", expected:"escopo" },
]) {
  const options=listDefenseCommercialExporters(scenario.ncm,scenario.origin,"2026-09-07");
  assert.ok(options,`medida esperada para ${scenario.ncm}/${scenario.origin}`);
  assert.equal(options.measure.requiresScopeValidation,true);
  assert.match(options.measure.scopeCondition,new RegExp(scenario.expected,"i"));
  const result=resolveDefenseCommercial({ncm:scenario.ncm,origin:scenario.origin,importDate:"2026-09-07",weightKg:1000,exchangeRate:5.5,exporter:options.options[0]?.exporter});
  assert.equal(result.status,"requires_input");
  assert.equal(result.exporterTreatment,"requires_validation");
  assert.equal(result.amountBrl,undefined);
  assert.equal(result.requiresScopeValidation,true);
  assert.ok(result.warnings.some(w=>/escopo|4 litros/i.test(w)));
}
console.log("Defense commercial product-scope safety regression passed.");
