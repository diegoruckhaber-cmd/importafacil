"use client";

import { useState } from "react";

const money = (value: number | null | undefined) =>
  value == null ? "—" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (value: number | null | undefined) =>
  value == null ? "—" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}%`;

type FormState = {
  ttd: "409" | "410";
  destination: "commercial_resale" | "industrialization";
  operation: "internal" | "interstate";
  outputValue: string;
  aliquotaPercent: string;
  continuousTTDMonths: string;
  annualQualifiedOutputBrl: string;
  requiredAnnualThresholdBrl: string;
  productClass: "other" | "steel_copper_coke_aluminum_silver";
  authorizedEarlyFullBenefit: boolean;
  validConcession: boolean;
  importEntryInSC: boolean;
  industrializationInSC: boolean;
  sameNcmPositionAfterFractionation: boolean;
  decree2128Prohibited: boolean;
};

const initial: FormState = {
  ttd: "409",
  destination: "commercial_resale",
  operation: "internal",
  outputValue: "100000",
  aliquotaPercent: "17",
  continuousTTDMonths: "36",
  annualQualifiedOutputBrl: "0",
  requiredAnnualThresholdBrl: "280000000",
  productClass: "other",
  authorizedEarlyFullBenefit: false,
  validConcession: true,
  importEntryInSC: true,
  industrializationInSC: false,
  sameNcmPositionAfterFractionation: true,
  decree2128Prohibited: false,
};

export default function SCOutputPage() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(current => ({ ...current, [key]: value }));

  const calculate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/sc-output-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível calcular a saída.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível calcular a saída.");
    } finally {
      setLoading(false);
    }
  };

  const benefit = result?.benefit;
  const denied = result?.status === "denied";
  const conditional = result?.status === "conditional";

  return (
    <main className="wrap scTest">
      <header className="scHeader">
        <div>
          <div className="eyebrow dark">LABORATÓRIO SC · SAÍDA</div>
          <h1>TTD 409/410 — efeito tributário da saída</h1>
          <p>Esta etapa mantém a saída separada do custo de importação. O crédito presumido só é monetizado depois da validação do enquadramento jurídico.</p>
        </div>
        <a className="secondaryBtn" href="/">Voltar ao simulador</a>
      </header>

      <div className="scGrid">
        <section className="card">
          <h2>1. Operação de saída</h2>
          <div className="fields">
            <label>TTD<select value={form.ttd} onChange={e => update("ttd", e.target.value as FormState["ttd"])}><option value="409">TTD 409</option><option value="410">TTD 410</option></select></label>
            <label>Destinação<select value={form.destination} onChange={e => update("destination", e.target.value as FormState["destination"])}><option value="commercial_resale">Revenda/comercialização</option><option value="industrialization">Industrialização</option></select></label>
            <label>Operação<select value={form.operation} onChange={e => update("operation", e.target.value as FormState["operation"])}><option value="internal">Interna</option><option value="interstate">Interestadual</option></select></label>
            <label>Valor da saída (R$)<input type="number" min="0" value={form.outputValue} onChange={e => update("outputValue", e.target.value)} /></label>
            <label>Alíquota ICMS (%)<input type="number" min="0" max="99.99" step="any" value={form.aliquotaPercent} onChange={e => update("aliquotaPercent", e.target.value)} /></label>
            <label>Meses contínuos no TTD<input type="number" min="0" value={form.continuousTTDMonths} onChange={e => update("continuousTTDMonths", e.target.value)} /></label>
            <label>Saída anual qualificada (R$)<input type="number" min="0" value={form.annualQualifiedOutputBrl} onChange={e => update("annualQualifiedOutputBrl", e.target.value)} /></label>
            <label>Limite anual considerado (R$)<input type="number" min="0" value={form.requiredAnnualThresholdBrl} onChange={e => update("requiredAnnualThresholdBrl", e.target.value)} /></label>
            <label>Classe da mercadoria<select value={form.productClass} onChange={e => update("productClass", e.target.value as FormState["productClass"])}><option value="other">Demais mercadorias</option><option value="steel_copper_coke_aluminum_silver">Aço/cobre/coque/alumínio/prata</option></select></label>
          </div>

          <h2 style={{ marginTop: 26 }}>2. Evidências jurídicas</h2>
          <div className="checks">
            <label><input type="checkbox" checked={form.validConcession} onChange={e => update("validConcession", e.target.checked)} /> Ato concessivo válido</label>
            <label><input type="checkbox" checked={form.importEntryInSC} onChange={e => update("importEntryInSC", e.target.checked)} /> Entrada/importação elegível em SC</label>
            <label><input type="checkbox" checked={form.authorizedEarlyFullBenefit} onChange={e => update("authorizedEarlyFullBenefit", e.target.checked)} /> Autorização fiscal para benefício integral antecipado</label>
            <label><input type="checkbox" checked={form.decree2128Prohibited} onChange={e => update("decree2128Prohibited", e.target.checked)} /> Vedação conhecida pelo Decreto SC 2.128/2009</label>
            {form.destination === "industrialization" && <label><input type="checkbox" checked={form.industrializationInSC} onChange={e => update("industrializationInSC", e.target.checked)} /> Industrialização ocorre em SC</label>}
            <label><input type="checkbox" checked={form.sameNcmPositionAfterFractionation} onChange={e => update("sameNcmPositionAfterFractionation", e.target.checked)} /> Mesma posição NCM e características preservadas</label>
          </div>

          <button className="primaryBtn" onClick={calculate} disabled={loading}>{loading ? "Calculando…" : "Calcular efeito da saída"}</button>
          {error && <div className="warning" style={{ marginTop: 14 }}>⚠️ {error}</div>}
        </section>

        <aside className="card scResult">
          <div className="resultTop"><h2>Resultado</h2>{result && <Status status={result.status} />}</div>
          {!result ? <div className="empty">Preencha a operação para calcular a carga efetiva e o crédito presumido.</div> : (
            <>
              <div className="metrics">
                <Metric t="ICMS normal da saída" v={money(benefit?.normalOutputICMS)} />
                <Metric t="ICMS alvo da saída" v={money(benefit?.targetOutputICMS)} />
                <Metric t="Crédito presumido estimado" v={money(benefit?.presumedCreditAmount)} hi />
                <Metric t="Carga final alvo" v={pct(benefit?.targetTaxLoadPercent)} />
                <Metric t="% do ICMS normal convertido em crédito" v={pct(benefit?.presumedCreditPercentOfOutputICMS)} />
              </div>

              {denied && <div className="warning">🚫 O TTD foi bloqueado. Nenhum benefício econômico foi aplicado.</div>}
              {conditional && <div className="warning">⚠️ Resultado condicional. O sistema não apresentou crédito presumido porque a elegibilidade ainda não está comprovada.</div>}

              <div className="auditBox" style={{ marginTop: 18 }}>
                <h4>Memória jurídica</h4>
                <p>{result.decision?.reasons?.join(" ") || "Sem justificativa registrada."}</p>
                {benefit?.reasons?.length > 0 && <p>{benefit.reasons.join(" ")}</p>}
                {benefit?.warnings?.length > 0 && <p>⚠ {benefit.warnings.join(" ")}</p>}
              </div>

              <div className="infoNote" style={{ marginTop: 12 }}>
                O crédito presumido da saída é calculado sobre a base da saída e permanece separado do ICMS da importação. Ele não é abatido automaticamente do custo de nacionalização.
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}

function Metric({ t, v, hi = false }: { t: string; v: string; hi?: boolean }) {
  return <div className={`metric ${hi ? "hi" : ""}`}><small>{t}</small><b>{v}</b></div>;
}

function Status({ status }: { status: string }) {
  const label = status === "calculated" ? "CALCULADO" : status === "denied" ? "BLOQUEADO" : "CONDICIONAL";
  return <span className={`status ${status}`}>{label}</span>;
}
