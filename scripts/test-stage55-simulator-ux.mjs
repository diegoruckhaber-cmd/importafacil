import assert from "node:assert/strict";
import fs from "node:fs";
import { BRAZILIAN_UFS } from "../lib/state-jurisdiction-registry.ts";

const page = fs.readFileSync("app/simulacao-v2/page.tsx", "utf8");

assert.equal(BRAZILIAN_UFS.length, 27);
assert.match(page, /UF de destino/);
assert.match(page, /destinationUf/);
assert.match(page, /BRAZILIAN_UFS\.map/);
assert.match(page, /data-state-scope/);
assert.match(page, /general_rate_only/);
assert.match(page, /motor estadual completo/);
assert.match(page, /Benefícios, reduções, isenções, ST, diferimentos, antecipações e regimes especiais/);

assert.match(page, /NCM com exatamente 8 dígitos/);
assert.match(page, /informe o país de origem/);
assert.match(page, /a quantidade deve ser maior que zero/);
assert.match(page, /Informe peso líquido em pelo menos um item/);
assert.match(page, /Revise os dados antes de calcular/);

assert.match(page, /Cálculo concluído com alertas/);
assert.match(page, /Faltam informações para concluir/);
assert.match(page, /Cálculo bloqueado por segurança/);
assert.match(page, /Operação fora do escopo automático/);
assert.match(page, /Não trate este pré-estudo como resultado final/);
assert.match(page, /data-simulation-status/);
assert.match(page, /scrollIntoView/);

assert.match(page, /isSC && <ItemNum label="Alíquota ICMS normal SC %"/);
assert.match(page, /ttd: isSC \? item\.ttd : "none"/);
assert.match(page, /row\.state\?\.icmsGeneralRate/);
assert.match(page, /fetch\("\/api\/simulation-v2"/);
assert.doesNotMatch(page, /label="ICMS normal %"/);

const engine = fs.readFileSync("lib/unified-import-simulation.ts", "utf8");
assert.match(engine, /generalStateRule!\.ratePercent/);
assert.match(engine, /homologada apenas para a regra geral de ICMS/);

console.log("Stage 55 simulator UX regression passed.");
