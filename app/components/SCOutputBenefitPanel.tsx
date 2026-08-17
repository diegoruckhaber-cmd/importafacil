"use client";

import { useState } from "react";

type Props = {
  ttd: "409" | "410" | "77" | "none";
  destination: "commercial_resale" | "industrialization";
  validConcession: boolean;
  importEntryInSC: boolean;
  industrializationInSC: boolean;
  sameNcmPositionAfterFractionation: boolean;
  decree2128Prohibited: boolean;
};

const br = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pct = (n: number | null | undefined) =>
  n == null ? "—" : `${Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

export default function SCOutputBenefitPanel(props: Props) {
  const [open, setOpen] = useState(false);
  const [operation, setOperation] = useState<"internal" | "interstate">("internal");
  const [outputValue, setOutputValue] = useState(0);
  const [aliquotaPercent, setAliquotaPercent] = useState(17);
  const [continuousTTDMonths, setContinuousTTDMonths] = useState(36);
  const [annualQualifiedOutputBrl, setAnnualQualifiedOutputBrl] = useState(0);
  const [productClass, setProductClass] = useState<"other" | "steel_copper_coke_aluminum_silver">("other");
  const [authorizedEarlyFullBenefit, setAuthorizedEarlyFullBenefit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const available = props.ttd === "409" || props.ttd === "410";

  const calculate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/sc-output-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ttd: Number(props.ttd),
          destination: props.destination,
          operation,
          outputValue,
          aliquotaPercent,
          validConcession: props.validConcession,
          importEntryInSC: props.importEntryInSC,
          industrializationInSC: props.industrializationInSC,
          sameNcmPositionAfterFractionation: props.sameNcmPositionAfterFractionation,
          decree2128Prohibited: props.decree2128Prohibited,
          continuousTTDMonths,
          annualQualifiedOutputBrl,
          productClass,
          authorizedEarlyFullBenefit,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível calcular o benefício da saída.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível calcular o benefício da saída.");
    } finally {
      setLoading(false);
    }
  };

  if (!available) return null;

  return (
    <div className="auditBox" style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div>
          <h4 style={{ marginBottom: 4 }}>Etapa 2 — Tratamento da saída</h4>
          <p style={{ margin: 0 }}>O benefício da saída é calculado separadamente do ICMS da importação.</p>
        </div>
        <button className="secondaryBtn" onClick={() => setOpen(v => !v)}>{open ? "Fechar" : "Calcular saída"}</button>
      </div>

      {open && (
        <div style={{ marginTop: 18 }}>
          <div className="fields">
            <label>Operação da saída<select value={operation} onChange={e => setOperation(e.target.value as "internal" | "interstate")}><option value="internal">Interna</option><option value="interstate">Interestadual</option></select></label>
            <label>Valor da saída (R$)<input type="number" min="0" step="any" value={outputValue} onChange={e => setOutputValue(Number(e.target.value))} /></label>
            <label>ICMS normal da saída (%)<input type="number" min="0" max="99.99" step="any" value={aliquotaPercent} onChange={e => setAliquotaPercent(Number(e.target.value))} /></label>
            <label>Meses contínuos no TTD<input type="number" min="0" step="1" value={continuousTTDMonths} onChange={e => setContinuousTTDMonths(Number(e.target.value))} /></label>
            <label>Saída anual qualificada (R$)<input type="number" min="0" step="any" value={annualQualifiedOutputBrl} onChange={e => setAnnualQualifiedOutputBrl(Number(e.target.value))} /></label>
            <label>Classe da mercadoria<select value={productClass} onChange={e => setProductClass(e.target.value as typeof productClass)}><option value="other">Outras mercadorias</option><option value="steel_copper_coke_aluminum_silver">Aço/cobre/coque/alumínio/prata</option></select></label>
          </div>
          <label className="checks" style={{ display: "block", marginTop: 12 }}><input type="checkbox" checked={authorizedEarlyFullBenefit} onChange={e => setAuthorizedEarlyFullBenefit(e.target.checked)} /> Tenho autorização fiscal válida para benefício integral antecipado</label>

          <button className="primaryBtn" style={{ marginTop: 14 }} onClick={calculate} disabled={loading || outputValue <= 0}>{loading ? "Calculando saída..." : "Calcular benefício da saída"}</button>
          {error && <div className="notice" style={{ marginTop: 12 }}>{error}</div>}

          {result && (
            <div style={{ marginTop: 18 }}>
              <div className={`decision ${result.status === "calculated" ? "applied" : result.status === "conditional" ? "conditional" : "blocked"}`}>
                <strong>{result.status === "calculated" ? `TTD ${props.ttd} — benefício calculado` : result.status === "conditional" ? "Saída condicional" : "Saída bloqueada"}</strong>
                <span>{result.benefit?.reasons?.join(" ") || result.decision?.reasons?.join(" ")}</span>
              </div>
              <div className="metrics" style={{ marginTop: 12 }}>
                <div className="metric"><small>ICMS normal da saída</small><b>{br(result.benefit?.normalOutputICMS)}</b></div>
                <div className="metric"><small>ICMS com carga efetiva</small><b>{br(result.benefit?.targetOutputICMS)}</b></div>
                <div className="metric hi"><small>Crédito presumido</small><b>{br(result.benefit?.presumedCreditAmount)}</b></div>
                <div className="metric"><small>Carga final</small><b>{pct(result.benefit?.targetTaxLoadPercent)}</b></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <small><b>Importante:</b> este valor pertence à etapa da saída e não reduz automaticamente o ICMS devido na importação nem altera o custo aduaneiro.</small>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
