"use client";

import { useMemo, useState } from "react";
import { resolveFederalTaxes } from "../../lib/federal-tax-resolution";

export default function SCFederalLivePage() {
  const [date, setDate] = useState("2026-08-14");
  const [iiRate, setIiRate] = useState(12);
  const [ipiRate, setIpiRate] = useState(5);
  const [pisRate, setPisRate] = useState<number | undefined>(undefined);
  const [cofinsStandard, setCofinsStandard] = useState(9.65);
  const [reducedCofins, setReducedCofins] = useState(false);
  const [additional060, setAdditional060] = useState(false);
  const [iiReducedRate, setIiReducedRate] = useState<number | undefined>(undefined);
  const [iiBenefit, setIiBenefit] = useState<"none" | "reduced_rate" | "exemption" | "suspension">("none");

  const result = useMemo(() => resolveFederalTaxes({
    date: date as `${number}-${number}-${number}`,
    statutoryIIRate: Number.isFinite(iiRate) ? iiRate : undefined,
    reducedIIRate: iiReducedRate,
    iiBenefitKind: iiBenefit,
    pisImportRate: pisRate,
    cofinsStandardRate: cofinsStandard,
    cofinsReducedBenefit: reducedCofins,
    cofinsAdditional060: additional060,
    ipiRate: Number.isFinite(ipiRate) ? ipiRate : undefined,
  }), [date, iiRate, ipiRate, pisRate, cofinsStandard, reducedCofins, additional060, iiReducedRate, iiBenefit]);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 32, fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2 }}>IMPORTAFÁCIL · SC + FEDERAL MVP</div>
        <h1 style={{ marginBottom: 8 }}>Resolução tributária federal por item</h1>
        <p style={{ color: "#666", maxWidth: 800 }}>Esta bancada usa o mesmo resolver federal que será conectado à operação SC. Ela não inventa alíquotas: quando a base NCM/TIPI não estiver disponível, informa a pendência.</p>
      </div>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 22, marginBottom: 20 }}>
        <h2>Entradas fiscais</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
          <label>Data<input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} /></label>
          <label>II estatutário %<input type="number" step="0.001" value={iiRate} onChange={e => setIiRate(Number(e.target.value))} style={inputStyle} /></label>
          <label>IPI %<input type="number" step="0.001" value={ipiRate} onChange={e => setIpiRate(Number(e.target.value))} style={inputStyle} /></label>
          <label>PIS-Importação % (opcional)<input type="number" step="0.001" value={pisRate ?? ""} onChange={e => setPisRate(e.target.value === "" ? undefined : Number(e.target.value))} placeholder="automático" style={inputStyle} /></label>
          <label>Cofins padrão %<input type="number" step="0.001" value={cofinsStandard} onChange={e => setCofinsStandard(Number(e.target.value))} style={inputStyle} /></label>
          <label>II reduzido % (opcional)<input type="number" step="0.001" value={iiReducedRate ?? ""} onChange={e => setIiReducedRate(e.target.value === "" ? undefined : Number(e.target.value))} placeholder="sem redução" style={inputStyle} /></label>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 18 }}>
          <label><input type="checkbox" checked={reducedCofins} onChange={e => setReducedCofins(e.target.checked)} /> Benefício reduzido de Cofins</label>
          <label><input type="checkbox" checked={additional060} onChange={e => setAdditional060(e.target.checked)} /> Adicional Cofins +0,60 p.p.</label>
          <label>Fundamento/tratamento II <select value={iiBenefit} onChange={e => setIiBenefit(e.target.value as typeof iiBenefit)}><option value="none">Normal</option><option value="reduced_rate">Alíquota reduzida</option><option value="exemption">Isenção</option><option value="suspension">Suspensão</option></select></label>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 22, marginBottom: 20 }}>
        <h2>Resultado resolvido</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
          <Metric label="PIS" value={`${result.pisImportRate}%`} automatic={result.automatic.pisImport} />
          <Metric label="COFINS" value={`${result.cofinsImportRate}%`} automatic={result.automatic.cofinsImport} detail={`exibição ${result.cofinsDisplayRate}%`} />
          <Metric label="II" value={result.iiRate == null ? "Pendente" : `${result.iiRate}%`} automatic={result.automatic.ii} />
          <Metric label="IPI" value={result.ipiRate == null ? "Pendente" : `${result.ipiRate}%`} automatic={result.automatic.ipi} />
          <Metric label="Fontes" value={`${result.sources.length}`} automatic={true} />
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 22 }}>
        <h2>Memória / alertas</h2>
        {result.warnings.length === 0 ? <p>✓ Nenhuma pendência federal identificada nas informações fornecidas.</p> : <ul>{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
        <p style={{ color: "#666", fontSize: 13 }}>Fontes: {result.sources.join(" · ")}</p>
      </section>
    </main>
  );
}

function Metric({ label, value, automatic, detail }: { label: string; value: string; automatic: boolean; detail?: string }) {
  return <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 14 }}><div style={{ fontSize: 12, color: "#666" }}>{label}</div><strong style={{ display: "block", fontSize: 22, margin: "6px 0" }}>{value}</strong><div style={{ fontSize: 11 }}>{automatic ? "resolvido pelo motor" : "informado/pendente"}</div>{detail && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{detail}</div>}</div>;
}

const inputStyle: React.CSSProperties = { display: "block", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #ccc", borderRadius: 7, boxSizing: "border-box" };
