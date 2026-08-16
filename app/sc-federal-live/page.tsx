"use client";

import { useMemo, useState } from "react";
import { resolveFederalTaxes } from "../../lib/federal-tax-resolution";

export default function SCFederalLivePage() {
  const [ncm, setNcm] = useState("3208.10.20");
  const [origin, setOrigin] = useState("CN");
  const [date, setDate] = useState("2026-08-15");
  const [pisRate, setPisRate] = useState<number | undefined>(undefined);
  const [cofinsStandard, setCofinsStandard] = useState(9.65);
  const [reducedCofins, setReducedCofins] = useState(false);
  const [additional060, setAdditional060] = useState(false);
  const [iiReducedRate, setIiReducedRate] = useState<number | undefined>(undefined);
  const [iiBenefit, setIiBenefit] = useState<"none" | "reduced_rate" | "exemption" | "suspension">("none");

  const result = useMemo(() => resolveFederalTaxes({
    ncm,
    date: date as `${number}-${number}-${number}`,
    reducedIIRate: iiReducedRate,
    iiBenefitKind: iiBenefit,
    pisImportRate: pisRate,
    cofinsStandardRate: cofinsStandard,
    cofinsReducedBenefit: reducedCofins,
    cofinsAdditional060: additional060,
  }), [ncm, date, pisRate, cofinsStandard, reducedCofins, additional060, iiReducedRate, iiBenefit]);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 32, fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2 }}>IMPORTAFÁCIL · SC + FEDERAL MVP</div>
        <h1 style={{ marginBottom: 8 }}>Teste automático por NCM</h1>
        <p style={{ color: "#666", maxWidth: 820 }}>
          Esta é a bancada de validação que usa o mesmo resolver federal da operação SC. Informe a NCM e a data: o sistema tenta localizar II e IPI no catálogo versionado, sem pedir que você digite essas alíquotas.
        </p>
      </div>

      <section style={cardStyle}>
        <h2>1. Identificação</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
          <label>NCM<input value={ncm} onChange={e => setNcm(e.target.value)} placeholder="0000.00.00" style={inputStyle} /></label>
          <label>Origem<input value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())} maxLength={2} style={inputStyle} /></label>
          <label>Data da importação<input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} /></label>
        </div>
      </section>

      <section style={cardStyle}>
        <h2>2. Parâmetros complementares</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
          <label>PIS-Importação % (opcional)<input type="number" step="0.001" value={pisRate ?? ""} onChange={e => setPisRate(e.target.value === "" ? undefined : Number(e.target.value))} placeholder="padrão do motor" style={inputStyle} /></label>
          <label>COFINS padrão %<input type="number" step="0.001" value={cofinsStandard} onChange={e => setCofinsStandard(Number(e.target.value))} style={inputStyle} /></label>
          <label>II reduzido % (opcional)<input type="number" step="0.001" value={iiReducedRate ?? ""} onChange={e => setIiReducedRate(e.target.value === "" ? undefined : Number(e.target.value))} placeholder="sem redução" style={inputStyle} /></label>
          <label>Tratamento II<select value={iiBenefit} onChange={e => setIiBenefit(e.target.value as typeof iiBenefit)} style={inputStyle}><option value="none">Normal</option><option value="reduced_rate">Alíquota reduzida</option><option value="exemption">Isenção</option><option value="suspension">Suspensão</option></select></label>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 18 }}>
          <label><input type="checkbox" checked={reducedCofins} onChange={e => setReducedCofins(e.target.checked)} /> Benefício reduzido de Cofins</label>
          <label><input type="checkbox" checked={additional060} onChange={e => setAdditional060(e.target.checked)} /> Adicional Cofins +0,60 p.p.</label>
        </div>
      </section>

      <section style={cardStyle}>
        <h2>3. Resultado automático</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          <Metric label="PIS" value={`${result.pisImportRate}%`} automatic={result.automatic.pisImport} />
          <Metric label="COFINS" value={`${result.cofinsImportRate}%`} automatic={result.automatic.cofinsImport} detail={`exibição ${result.cofinsDisplayRate}%`} />
          <Metric label="II" value={result.iiRate == null ? "Pendente" : `${result.iiRate}%`} automatic={result.automatic.ii} />
          <Metric label="IPI" value={result.ipiRate == null ? "Pendente" : `${result.ipiRate}%`} automatic={result.automatic.ipi} />
        </div>
        <div style={{ marginTop: 18, padding: 12, background: "#f6f6f6", borderRadius: 8, fontSize: 13 }}><b>Item:</b> NCM {ncm} · origem {origin} · vigência {date}</div>
      </section>

      <section style={cardStyle}>
        <h2>4. Memória e alertas</h2>
        {result.warnings.length === 0 ? <p>✓ Nenhuma pendência federal identificada.</p> : <ul>{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
        <p style={{ color: "#666", fontSize: 13 }}>Fontes: {result.sources.join(" · ")}</p>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 0 }}>Regra de segurança: ausência de NCM no catálogo não vira alíquota estimada.</p>
      </section>

      <div style={{ marginTop: 18, padding: 14, borderRadius: 10, border: "1px solid #ddd", fontSize: 13 }}>
        <b>Próxima etapa do teste:</b> usar esta resolução dentro de uma operação SC com valor, frete, seguro, despesas, TTD e ICMS.
      </div>
    </main>
  );
}

function Metric({ label, value, automatic, detail }: { label: string; value: string; automatic: boolean; detail?: string }) {
  return <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 14 }}><div style={{ fontSize: 12, color: "#666" }}>{label}</div><strong style={{ display: "block", fontSize: 22, margin: "6px 0" }}>{value}</strong><div style={{ fontSize: 11 }}>{automatic ? "resolvido pelo motor" : "pendente / não automático"}</div>{detail && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{detail}</div>}</div>;
}

const cardStyle: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 12, padding: 22, marginBottom: 20 };
const inputStyle: React.CSSProperties = { display: "block", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #ccc", borderRadius: 7, boxSizing: "border-box" };
