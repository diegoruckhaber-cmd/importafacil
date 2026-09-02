import assert from "node:assert/strict";
import { parsePage } from "./sync-mdic-defesa-comercial.mjs";

const html = `
<html><body>
<h1>Chapas off-set</h1>
<p>Tipo de Medida: Direito Antidumping Definitivo</p>
<p>NCM: 3701.30.21 e 3701.30.31</p>
<p>Países de origem: China, Estados Unidos da América, Taipé Chinês, União Europeia e Reino Unido</p>
<h2>Direito Aplicado:</h2>
<p>China:</p>
<p>- Empresa Chinesa Ltd. = US$ 2,09/kg</p>
<p>- Demais = US$ 2,35/kg</p>
<p>Taipé Chinês:</p>
<p>- Top High Image Corporate = Zero</p>
<p>- Demais = US$ 2,36/kg</p>
<p>EUA:</p>
<p>- Todas as empresas = US$ 1,58/kg</p>
<p>União Europeia:</p>
<p>- Todas as empresas = US$ 2,38/kg</p>
<p>- Reino Unido (*):</p>
<p>Todas as empresas = US$ 2,38/kg</p>
<p>Prazo da Vigência: 05/05/2026</p>
</body></html>`;

const parsed = parsePage("https://www.gov.br/mdic/exemplo", html);
assert.ok(parsed, "a página antidumping deve ser reconhecida");
assert.deepEqual(parsed.ncmPatterns, ["37013021", "37013031"]);

assert.deepEqual(parsed.exportersByOrigin["reino unido"], [
  { exporter: "Todas as empresas", rate: 2.38, unit: "USD_PER_KG", collectionSuspended: false },
]);

assert.ok(parsed.exportersByOrigin["estados unidos da américa"].some((option) => option.exporter === "Todas as empresas" && option.rate === 1.58));
assert.ok(parsed.exportersByOrigin["taipé chinês"].some((option) => option.exporter === "Top High Image Corporate" && option.rate === 0 && option.unit === "USD_PER_KG"));
assert.ok(parsed.exportersByOrigin.china.some((option) => option.exporter === "Empresa Chinesa Ltd." && option.rate === 2.09));

console.log("MDIC defense parser: annotated origin/prose rights OK");
