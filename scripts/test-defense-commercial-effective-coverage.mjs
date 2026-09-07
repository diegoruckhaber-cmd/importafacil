import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { listDefenseCommercialExporters } from "../lib/defesa-comercial-registry.ts";
import { resolveDefenseCommercial } from "../lib/defesa-comercial-resolver.ts";

const AUDIT_DATE = "2026-09-07";
const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "defesa-comercial-mdic.json"), "utf8"));

const pairs = new Map();
for (const measure of catalog) {
  for (const origin of measure.origins ?? []) {
    const key = `${measure.ncm}|${origin}`;
    if (!pairs.has(key)) pairs.set(key, { ncm: measure.ncm, origin, products: new Set(), sourceUrls: new Set() });
    const pair = pairs.get(key);
    pair.products.add(measure.product);
    if (measure.sourceUrl) pair.sourceUrls.add(measure.sourceUrl);
  }
}

const summary = { resolved: [], unresolved: [], ambiguous: [], inactiveOrFiltered: [] };
for (const pair of pairs.values()) {
  const exporters = listDefenseCommercialExporters(pair.ncm, pair.origin, AUDIT_DATE);
  const base = {
    ncm: pair.ncm,
    origin: pair.origin,
    products: [...pair.products],
    sourceUrls: [...pair.sourceUrls],
  };

  if (!exporters) {
    summary.inactiveOrFiltered.push(base);
    continue;
  }
  if (exporters.ambiguous) {
    summary.ambiguous.push({ ...base, scopes: exporters.matchingScopes.map((scope) => scope.product) });
    const resolution = resolveDefenseCommercial({ ncm: pair.ncm, origin: pair.origin, importDate: AUDIT_DATE, weightKg: 1000, quantity: 1000, areaM2: 100, customsValueBrl: 100000, exchangeRate: 5.5 });
    assert.equal(resolution.status, "requires_input", `${pair.ncm}/${pair.origin}: escopo ambíguo deve bloquear cálculo`);
    assert.equal(resolution.amountBrl, undefined, `${pair.ncm}/${pair.origin}: escopo ambíguo não pode gerar valor`);
    continue;
  }
  if (!exporters.options.length) {
    summary.unresolved.push(base);
    const resolution = resolveDefenseCommercial({ ncm: pair.ncm, origin: pair.origin, importDate: AUDIT_DATE, weightKg: 1000, quantity: 1000, areaM2: 100, customsValueBrl: 100000, exchangeRate: 5.5 });
    assert.equal(resolution.status, "requires_input", `${pair.ncm}/${pair.origin}: matriz incompleta deve exigir validação`);
    assert.equal(resolution.amountBrl, undefined, `${pair.ncm}/${pair.origin}: matriz incompleta não pode gerar valor`);
    assert.equal(resolution.exporterTreatment, "requires_validation", `${pair.ncm}/${pair.origin}: matriz incompleta deve sinalizar validação`);
    continue;
  }
  summary.resolved.push({ ...base, optionCount: exporters.options.length });
}

const compact = {
  auditDate: AUDIT_DATE,
  generatedNcmOriginPairs: pairs.size,
  effectiveResolvedCount: summary.resolved.length,
  effectiveUnresolvedCount: summary.unresolved.length,
  effectiveAmbiguousCount: summary.ambiguous.length,
  inactiveOrFilteredCount: summary.inactiveOrFiltered.length,
  effectiveUnresolved: summary.unresolved,
  effectiveAmbiguous: summary.ambiguous,
};

assert.ok(summary.resolved.length > 0, "auditoria deve encontrar combinações efetivamente resolvidas");
console.log(JSON.stringify(compact, null, 2));
console.log("defense-commercial effective exporter coverage: OK");
