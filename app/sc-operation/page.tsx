"use client";

import { useMemo, useState } from "react";
import { calculateSCImportOperation } from "../../lib/sc-import-operation";
import { runSCEndToEnd } from "../../lib/sc-end-to-end";

const money = (n: number | null) => n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SCOperationPage() {
  const [s, setS] = useState({
    quantity: 1000, unitFobUsd: 10, exchangeRate: 5.5, freightUsd: 1200, insuranceUsd: 100,
    otherBrl: 3500, icmsTaxableAdditionsBrl: 0, iiRate: 12, ipiRate: 0, pisImportRate: 2.1,
    cofinsImportRate: 9.65, icmsRate: 17, ttd: "409", destination: "commercial_resale",
    benefitICMS: "6500", validConcession: true, importEntryInSC: true,
  });
  const [submitted, setSubmitted] = useState(false);

  const operation = useMemo(() => {
    try { return calculateSCImportOperation(s); } catch { return null; }
  }, [s]);

  const decision = useMemo(() => {
    if (!submitted || !operation) return null;
    return runSCEndToEnd([{
      id: "ITEM-1",
      ttd: Number(s.ttd) as 409 | 410 | 77,
      destination: s.destination as "commercial_resale" | "industrialization",
      importEntryInSC: s.importEntryInSC,
      validConcession: s.validConcession,
      normalICMS: operation.taxes.icms.payable,
      benefitICMS: Number(s.benefitICMS) || 0,
      effect: { kind: "presumed_credit", creditOnOutput: true, notes: ["Valor do benefício ainda é parâmetro de teste; deverá vir da camada jurídica validada."] },
    }]);
  }, [s, submitted, operation]);

  const change = (key: string, value: string | boolean) => setS(x => ({ ...x, [key]: typeof value === "boolean" ? value : Number(value) }));
  const changeText = (key: string, value: string) => setS(x => ({ ...x, [key]: value }));

  return <main className="wrap scTest">
    <div className="scHeader">
      <div><div className="eyebrow dark">LABORATÓRIO SC · OPERAÇÃO REAL</div><h1>Simule uma importação de verdade</h1><p>Agora o ICMS normal deixa de ser digitado manualmente: ele é calculado a partir de valor, câmbio, frete, seguro, tributos e demais parcelas informadas.</p></div>
      <a className="secondaryBtn" href="/sc-test">Teste jurídico</a>
    </div>

    <div className="scGrid">
      <section className="card">
        <h2 style={{marginTop:0}}>Dados da operação</h2>
        <div className="fields">
          <Field label="Quantidade" value={s.quantity} onChange={v => change("quantity", v)}/>
          <Field label="FOB unitário (US$)" value={s.unitFobUsd} onChange={v => change("unitFobUsd", v)}/>
          <Field label="Câmbio (R$/US$)" value={s.exchangeRate} onChange={v => change("exchangeRate", v)}/>
          <Field label="Frete internacional (US$)" value={s.freightUsd} onChange={v => change("freightUsd", v)}/>
          <Field label="Seguro internacional (US$)" value={s.insuranceUsd} onChange={v => change("insuranceUsd", v)}/>
          <Field label="Outras despesas (R$)" value={s.otherBrl} onChange={v => change("otherBrl", v)}/>
          <Field label="Acréscimos tributáveis no ICMS (R$)" value={s.icmsTaxableAdditionsBrl} onChange={v => change("icmsTaxableAdditionsBrl", v)}/>
          <Field label="II (%)" value={s.iiRate} onChange={v => change("iiRate", v)}/>
          <Field label="IPI (%)" value={s.ipiRate} onChange={v => change("ipiRate", v)}/>
          <Field label="PIS-Importação (%)" value={s.pisImportRate} onChange={v => change("pisImportRate", v)}/>
          <Field label="COFINS-Importação (%)" value={s.cofinsImportRate} onChange={v => change("cofinsImportRate", v)}/>
          <Field label="ICMS (%)" value={s.icmsRate} onChange={v => change("icmsRate", v)}/>
        </div>

        <h2 style={{marginTop:28}}>Tratamento SC</h2>
        <div className="fields">
          <label>TTD<select value={s.ttd} onChange={e => changeText("ttd", e.target.value)}><option value="409">TTD 409</option><option value="410">TTD 410</option><option value="77">TTD 77</option></select></label>
          <label>Destinação<select value={s.destination} onChange={e => changeText("destination", e.target.value)}><option value="commercial_resale">Comercialização</option><option value="industrialization">Industrialização</option></select></label>
          <Field label="ICMS beneficiado — teste (R$)" value={Number(s.benefitICMS)} onChange={v => change("benefitICMS", v)}/>
        </div>
        <div className="checks">
          <label><input type="checkbox" checked={s.validConcession} onChange={e => change("validConcession", e.target.checked)}/> Ato concessivo válido</label>
          <label><input type="checkbox" checked={s.importEntryInSC} onChange={e => change("importEntryInSC", e.target.checked)}/> Entrada/importação elegível em SC</label>
        </div>
        <button className="primaryBtn" onClick={() => setSubmitted(true)}>Calcular e analisar</button>
      </section>

      <aside className="card scResult">
        <div className="resultTop"><h2>Resultado</h2>{decision && <Status status={decision.status}/>}</div>
        {!operation ? <div className="empty">Revise os dados numéricos da operação.</div> : <>
          <div className="metrics">
            <Metric t="Valor aduaneiro" v={money(operation.valorAduaneiro)} />
            <Metric t="II" v={money(operation.taxes.ii.payable)} />
            <Metric t="IPI" v={money(operation.taxes.ipi.payable)} />
            <Metric t="PIS + COFINS" v={money(operation.taxes.pisImport.payable + operation.taxes.cofinsImport.payable)} />
            <Metric t="ICMS normal" v={money(operation.taxes.icms.payable)} hi />
            <Metric t="Custo nacionalizado antes do benefício" v={money(operation.totalLandedCostBeforeBenefit)} />
          </div>
          {!decision ? <div className="warning">Clique em <b>Calcular e analisar</b> para rodar também o motor jurídico SC.</div> : <>
            <div className="decisionList">{decision.items.map(({decision: d, comparison}) => <div className="decision" key={d.itemId}><div><b>Item {d.itemId}</b><p>{d.reasons.join(" ")}</p>{d.blockingIssues.length > 0 && <small>⚠ {d.blockingIssues.join(" · ")}</small>}</div><Status status={d.decision === "apply" ? "calculated" : d.decision === "deny" ? "blocked" : "conditional"}/><div className="decisionMoney">Economia: {money(comparison?.estimatedSavings ?? null)}</div></div>)}</div>
            <div className="warning">⚠️ <b>Parâmetro de teste:</b> o ICMS beneficiado foi informado manualmente. A versão de produção deverá calcular esse efeito a partir do ato concessivo e da regra vigente.</div>
          </>}
        </>}
      </aside>
    </div>
  </main>
}

function Field({label,value,onChange}:{label:string,value:number,onChange:(v:string)=>void}){return <label>{label}<input type="number" min="0" step="any" value={value} onChange={e=>onChange(e.target.value)}/></label>}
function Metric({t,v,hi}:{t:string,v:string,hi?:boolean}){return <div className={`metric ${hi ? "hi" : ""}`}><small>{t}</small><b>{v}</b></div>}
function Status({status}:{status:string}){const label=status==="calculated"||status==="apply"?"APLICÁVEL":status==="blocked"||status==="deny"?"BLOQUEADO":"CONDICIONAL";return <span className={`status ${status}`}>{label}</span>}
