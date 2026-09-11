"use client";

import { useEffect, useState, type CSSProperties } from "react";

type FederalComponent = {
  status: "resolved" | "requires_input" | "not_found";
  rate: number | null;
  automatic: boolean;
  treatment?: string;
  taxTreatment?: "RATE" | "NT";
  source?: string;
  warnings: string[];
};

type FederalResolution = {
  ncm?: string;
  date: string;
  iiRate: number | null;
  ipiRate: number | null;
  pisImportRate: number;
  cofinsImportRate: number;
  ii: FederalComponent;
  ipi: FederalComponent;
  warnings: string[];
  blockingIssues: string[];
  sources: string[];
  snapshot: { mdicPublished: string | null; tipiUpdated: string | null };
};

type TriState = "unknown" | "true" | "false";

export default function SCFederalLivePage() {
  const [ncm, setNcm] = useState("3208.10.20");
  const [date, setDate] = useState("2026-09-10");
  const [iiExCode, setIiExCode] = useState("");
  const [ipiExCode, setIpiExCode] = useState("");
  const [iiQuotaConfirmed, setIiQuotaConfirmed] = useState<TriState>("unknown");
  const [aeronauticalEligible, setAeronauticalEligible] = useState<TriState>("unknown");
  const [result, setResult] = useState<FederalResolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (ncm.replace(/\D/g, "").length !== 8) {
        setResult(null);
        return;
      }

      const params = new URLSearchParams({ ncm, date });
      if (iiExCode.trim()) params.set("iiExCode", iiExCode.trim());
      if (ipiExCode.trim()) params.set("ipiExCode", ipiExCode.trim());
      if (iiQuotaConfirmed !== "unknown") params.set("iiQuotaConfirmed", iiQuotaConfirmed);
      if (aeronauticalEligible !== "unknown") params.set("aeronauticalEligible", aeronauticalEligible);

      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/federal-resolve?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível resolver os tributos federais.");
        setResult(data as FederalResolution);
      } catch (caught) {
        if ((caught as Error).name !== "AbortError") {
          setError(caught instanceof Error ? caught.message : "Erro ao consultar o motor federal.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [ncm, date, iiExCode, ipiExCode, iiQuotaConfirmed, aeronauticalEligible]);

  const alerts = [...new Set([...(result?.warnings ?? []), ...(result?.ii.warnings ?? []), ...(result?.ipi.warnings ?? [])])];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 32, fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2 }}>IMPORTAFÁCIL · FEDERAL DIAGNÓSTICO</div>
        <h1 style={{ marginBottom: 8 }}>Resolver federal canônico</h1>
        <p style={{ color: "#666", maxWidth: 850 }}>
          Esta bancada usa exclusivamente o mesmo resolver server-side consumido pelo simulador. II e IPI não são digitados manualmente: quando Ex, quota ou outro enquadramento pode alterar a tributação, o motor bloqueia o cálculo até receber a evidência necessária.
        </p>
      </div>

      <section style={cardStyle}>
        <h2>1. Operação</h2>
        <div style={gridStyle}>
          <Field label="NCM"><input value={ncm} onChange={(event) => setNcm(event.target.value)} style={inputStyle} /></Field>
          <Field label="Data da importação"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} style={inputStyle} /></Field>
          <Field label="EX de II, se aplicável"><input value={iiExCode} onChange={(event) => setIiExCode(event.target.value)} placeholder="Ex.: 001" style={inputStyle} /></Field>
          <Field label="EX da TIPI, se aplicável"><input value={ipiExCode} onChange={(event) => setIpiExCode(event.target.value)} placeholder="Ex.: 001" style={inputStyle} /></Field>
          <Field label="Quota aplicável/disponível?">
            <select value={iiQuotaConfirmed} onChange={(event) => setIiQuotaConfirmed(event.target.value as TriState)} style={inputStyle}>
              <option value="unknown">Não informado</option><option value="true">Sim</option><option value="false">Não</option>
            </select>
          </Field>
          <Field label="Enquadramento aeronáutico confirmado?">
            <select value={aeronauticalEligible} onChange={(event) => setAeronauticalEligible(event.target.value as TriState)} style={inputStyle}>
              <option value="unknown">Não informado</option><option value="true">Sim</option><option value="false">Não</option>
            </select>
          </Field>
        </div>
        {loading && <p style={mutedStyle}>Consultando snapshot oficial…</p>}
        {error && <p style={{ color: "#9b1c1c" }}>{error}</p>}
      </section>

      <section style={cardStyle}>
        <h2>2. Resultado</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          <Metric label="II" value={formatRate(result?.iiRate)} status={result?.ii.status} />
          <Metric label="IPI" value={formatRate(result?.ipiRate, result?.ipi.taxTreatment)} status={result?.ipi.status} />
          <Metric label="PIS-Importação" value={result ? `${result.pisImportRate}%` : "—"} status={result ? "resolved" : undefined} />
          <Metric label="COFINS-Importação" value={result ? `${result.cofinsImportRate}%` : "—"} status={result ? "resolved" : undefined} />
        </div>
        {result && <p style={mutedStyle}>Snapshot MDIC: {result.snapshot.mdicPublished ?? "—"} · TIPI: {result.snapshot.tipiUpdated ?? "—"}</p>}
      </section>

      <section style={cardStyle}>
        <h2>3. Gate fiscal</h2>
        {result?.blockingIssues.length ? (
          <div style={{ padding: 12, border: "1px solid #d7a5a5", borderRadius: 8 }}><b>Cálculo bloqueado:</b> {result.blockingIssues.join(" · ")}</div>
        ) : result ? (
          <div style={{ padding: 12, border: "1px solid #b7d7b7", borderRadius: 8 }}><b>✓ Federal resolvido sem pendências bloqueantes.</b></div>
        ) : null}
        {alerts.length > 0 && <ul>{alerts.map((alert) => <li key={alert}>{alert}</li>)}</ul>}
        {result?.sources.length ? <p style={mutedStyle}>Fontes: {[...new Set(result.sources)].join(" · ")}</p> : null}
        <p style={{ ...mutedStyle, marginBottom: 0 }}>Regra de segurança: concorrência de tratamentos, EX ou quota sem evidência nunca é resolvida pela ordem das linhas do arquivo oficial.</p>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label>{label}{children}</label>;
}

function Metric({ label, value, status }: { label: string; value: string; status?: FederalComponent["status"] }) {
  return <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 14 }}><div style={mutedStyle}>{label}</div><strong style={{ display: "block", fontSize: 22, margin: "6px 0" }}>{value}</strong><div style={{ fontSize: 11 }}>{status === "resolved" ? "resolvido" : status === "requires_input" ? "requer validação" : status === "not_found" ? "não localizado" : "aguardando"}</div></div>;
}

function formatRate(rate?: number | null, treatment?: "RATE" | "NT") {
  if (treatment === "NT") return "NT";
  return rate == null ? "Pendente" : `${rate}%`;
}

const cardStyle: CSSProperties = { border: "1px solid #ddd", borderRadius: 12, padding: 22, marginBottom: 20 };
const gridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 };
const inputStyle: CSSProperties = { display: "block", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #ccc", borderRadius: 7, boxSizing: "border-box" };
const mutedStyle: CSSProperties = { color: "#666", fontSize: 13 };
