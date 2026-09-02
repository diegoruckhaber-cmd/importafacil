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

const mixedSuspensionHtml = `
<html><body>
<h1>Pneus de carga</h1>
<p>Tipo de Medida: Direito Antidumping Definitivo e Compromisso de Preço</p>
<p>NCM: 4011.20.90</p>
<p>Países de Origem: Coreia do Sul, Japão e Tailândia</p>
<h2>Direito Aplicado</h2>
<p>Coreia</p>
<p>- Kumho Tires Co. Inc. = US$ 0,32/kg</p>
<p>Japão*</p>
<p>- Sumitomo Rubber Industries = US$ 0,21/kg*</p>
<p>Tailândia</p>
<p>- Zhongce Rubber Co. Ltd = US$ 0,55/kg</p>
<p>*Observação: Cobrança suspensa para as importações originárias do Japão</p>
<p>Prazo da Vigência: 22/03/2026</p>
</body></html>`;

const mixed = parsePage("https://www.gov.br/mdic/pneus-de-carga", mixedSuspensionHtml);
assert.ok(mixed, "página com suspensão por origem deve ser reconhecida");
assert.equal(mixed.collectionSuspended, false, "suspensão do Japão não pode suspender toda a medida");
assert.equal(mixed.exportersByOrigin["coreia do sul"][0].collectionSuspended, false);
assert.equal(mixed.exportersByOrigin["japão"][0].collectionSuspended, true);
assert.equal(mixed.exportersByOrigin["tailândia"][0].collectionSuspended, false);

console.log("MDIC defense parser: annotated origin/prose rights and scoped suspension OK");
