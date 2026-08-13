"use client";

import { useMemo, useState } from "react";
import { runSCEndToEnd, type SCEndToEndItem } from "../../lib/sc-end-to-end";

const money = (n: number | null) => n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type FormItem = {
  id: string;
  ncm: string;
  ttd: "409" | "410" | "77" | "none";
  destination: "commercial_resale" | "industrialization";
  normalICMS: string;
  benefitICMS: string;
  validConcession: boolean;
  importEntryInSC: boolean;
  decree2128Prohibited: boolean;
  sameNcmPositionAfterFractionation: boolean;
};

const makeItem = (id: string): FormItem => ({
  id,
  ncm: "",
  ttd: "409",
  destination: "commercial_resale",
  normalICMS: "26100",
  benefitICMS: "6500",
  validConcession: true,
  importEntryInSC: true,
  decree2128Prohibited: false,
  sameNcmPositionAfterFractionation: true,
});

export default function SCTestPage() {
  const [items, setItems] = useState<FormItem[]>([makeItem("1")]);
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!submitted) return null;
    const input: SCEndToEndItem[] = items.map((item) => ({
      id: item.id,
      ttd: item.ttd === "none" ? undefined : Number(item.ttd) as 409 | 410 | 77,
      destination: item.destination,
      normalICMS: Number(item.normalICMS) || 0,
      benefitICMS: Number(item.benefitICMS) || 0,
      validConcession: item.validConcession,
      importEntryInSC: item.importEntryInSC,
      decree2128Prohibited: item.decree2128Prohibited,
      sameNcmPositionAfterFractionation: item.sameNcmPositionAfterFractionation,
      effect: item.ttd === "none" ? undefined : { kind: "presumed_credit", creditOnOutput: true, notes: ["Parâmetro financeiro informado para teste; validar contra o ato concessivo antes de uso real."] },
    }));
    return runSCEndToEnd(input);
  }, [items, submitted]);

  const update = (id: string, patch: Partial<FormItem>) => setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  const add = () => setItems(current => [...current, makeItem(String(current.length + 1))]);

  return <main className="wrap scTest">
    <div className="scHeader">
      <div><div className="eyebrow dark">LABORATÓRIO SC</div><h1>Teste operacional — ICMS e TTD</h1><p>Primeira tela para testar o motor de decisão por item. Os valores de benefício abaixo são parâmetros de teste, não uma conclusão fiscal automática.</p></div>
      <a className="secondaryBtn" href="/">Voltar</a>
    </div>

    <div className="scGrid">
      <section>
        {items.map((item, index) => <div className="card scItem" key={item.id}>
          <div className="itemTitle"><h2>Item {index + 1}</h2><span>{item.ncm || "NCM não informada"}</span></div>
          <div className="fields">
            <label>NCM<input value={item.ncm} placeholder="Ex.: 3901.20.29" onChange={e => update(item.id, { ncm: e.target.value })}/></label>
            <label>TTD<select value={item.ttd} onChange={e => update(item.id, { ttd: e.target.value as FormItem["ttd"] })}><option value="409">TTD 409</option><option value="410">TTD 410</option><option value="77">TTD 77</option><option value="none">Sem TTD</option></select></label>
            <label>Destinação<select value={item.destination} onChange={e => update(item.id, { destination: e.target.value as FormItem["destination"] })}><option value="commercial_resale">Comercialização</option><option value="industrialization">Industrialização</option></select></label>
            <label>ICMS normal (R$)<input type="number" value={item.normalICMS} onChange={e => update(item.id, { normalICMS: e.target.value })}/></label>
            <label>ICMS com benefício (R$)<input type="number" value={item.benefitICMS} onChange={e => update(item.id, { benefitICMS: e.target.value })}/></label>
          </div>
          <div className="checks">
            <label><input type="checkbox" checked={item.validConcession} onChange={e => update(item.id, { validConcession: e.target.checked })}/> Ato concessivo válido</label>
            <label><input type="checkbox" checked={item.importEntryInSC} onChange={e => update(item.id, { importEntryInSC: e.target.checked })}/> Entrada/importação elegível em SC</label>
            <label><input type="checkbox" checked={item.decree2128Prohibited} onChange={e => update(item.id, { decree2128Prohibited: e.target.checked })}/> Mercadoria vedada pelo Decreto 2.128</label>
            <label><input type="checkbox" checked={item.sameNcmPositionAfterFractionation} onChange={e => update(item.id, { sameNcmPositionAfterFractionation: e.target.checked })}/> Mesma posição NCM após fracionamento</label>
          </div>
        </div>)}
        <div className="scActions"><button className="primaryBtn" onClick={() => setSubmitted(true)}>Analisar operação</button><button className="secondaryBtn" onClick={add}>+ Adicionar item</button></div>
      </section>

      <aside className="card scResult">
        <div className="resultTop"><h2>Resultado da análise</h2>{result && <Status status={result.status}/>}</div>
        {!result ? <div className="empty">Preencha os itens e clique em “Analisar operação”.</div> : <>
          <div className="metrics"><Metric t="ICMS normal" v={money(result.totalNormalICMS)} /><Metric t="ICMS com benefício" v={money(result.totalBenefitICMS)} hi/><Metric t="Economia estimada" v={money(result.totalEstimatedSavings)} /></div>
          <div className="decisionList">{result.items.map(({ decision, comparison }) => <div className="decision" key={decision.itemId}><div><b>Item {decision.itemId}</b><p>{decision.reasons.join(" ")}</p>{decision.blockingIssues.length > 0 && <small>⚠ {decision.blockingIssues.join(" · ")}</small>}</div><Status status={decision.decision === "apply" ? "calculated" : decision.decision === "deny" ? "blocked" : "conditional"}/><div className="decisionMoney">{comparison?.estimatedSavings != null ? `Economia: ${money(comparison.estimatedSavings)}` : "Sem economia calculada"}</div></div>)}</div>
          <div className="warning">⚠️ <b>Ambiente de teste:</b> o valor do benefício foi informado manualmente. A versão de produção deverá obter percentuais e condições da camada jurídica validada antes de apresentar economia como resultado definitivo.</div>
        </>}
      </aside>
    </div>
  </main>
}

function Metric({ t, v, hi }: { t: string; v: string; hi?: boolean }) { return <div className={`metric ${hi ? "hi" : ""}`}><small>{t}</small><b>{v}</b></div> }
function Status({ status }: { status: string }) { const label = status === "calculated" || status === "apply" ? "APLICÁVEL" : status === "blocked" || status === "deny" ? "BLOQUEADO" : "CONDICIONAL"; return <span className={`status ${status}`}>{label}</span> }
