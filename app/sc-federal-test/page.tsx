"use client";

import { useEffect, useMemo, useState } from "react";

type TTD = "none" | "409" | "410";
type NCMOption = { code: string; description: string; startDate?: string; endDate?: string };
type Calculation = any;

const money = (value: number) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const countryNames = new Intl.DisplayNames(["pt-BR"], { type: "region" });
const COUNTRY_CODES = ["CN", "US", "DE", "MX", "AR", "CL", "IT", "FR", "ES", "JP", "KR", "IN", "GB", "NL", "BE", "CH", "CA", "AU", "AT", "PT", "UY", "PY", "CO", "PE", "TR", "TW", "TH"];

export default function SCFederalTestPage() {
  const [ncm, setNcm] = useState("3208.10.20");
  const [ncmQuery, setNcmQuery] = useState("3208.10.20");
  const [ncmOptions, setNcmOptions] = useState<NCMOption[]>([]);
  const [ncmOpen, setNcmOpen] = useState(false);
  const [ncmLoading, setNcmLoading] = useState(false);
  const [origin, setOrigin] = useState("CN");
  const [date, setDate] = useState("2026-08-15");
  const [quantity, setQuantity] = useState(1000);
  const [fobUnit, setFobUnit] = useState(10);
  const [exchange, setExchange] = useState(5.5);
  const [freight, setFreight] = useState(1200);
  const [insurance, setInsurance] = useState(100);
  const [storage, setStorage] = useState(3500);
  const [icms, setIcms] = useState(17);
  const [ttd, setTtd] = useState<TTD>("410");
  const [destination, setDestination] = useState<"commercial_resale" | "industrialization">("commercial_resale");
  const [result, setResult] = useState<Calculation>(null);
  const [federal, setFederal] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const customsValue = useMemo(() => quantity * fobUnit * exchange, [quantity, fobUnit, exchange]);

  async function searchNCM(query: string) {
    setNcmLoading(true);
    try {
      const response = await fetch(`/api/ncm-search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar a tabela NCM.");
      setNcmOptions(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar a tabela NCM.");
    } finally {
      setNcmLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => searchNCM(ncmQuery), 250);
    return () => window.clearTimeout(timer);
  }, [ncmQuery]);

  function selectNCM(option: NCMOption) {
    setNcm(option.code);
    setNcmQuery(`${option.code} — ${option.description}`);
    setNcmOpen(false);
    setError("");
  }

  async function calculate() {
    setLoading(true);
    setError("");
    setResult(null);
    setFederal(null);

    try {
      const response = await fetch("/api/sc-federal-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          ncm,
          origin,
          date,
          quantity,
          fobUnit,
          exchange,
          freight,
          insurance,
          storage,
          icms,
          ttd,
          destination,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível calcular a operação.");

      setFederal(data.federal);
      setResult(data.calculation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível calcular a operação.");
    } finally {
      setLoading(false);
    }
  }

  const item = result?.items?.[0];

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: 32, fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2 }}>IMPORTAFÁCIL · TESTE DE ACEITAÇÃO</div>
        <h1>SC + Federal · operação ponta a ponta</h1>
        <p style={{ color: "#666", maxWidth: 850 }}>
          Esta bancada consulta a NCM oficial e executa o cálculo SC + Federal no servidor. Assim, o navegador não carrega o motor fiscal e qualquer erro de validação volta para a tela com uma mensagem clara.
        </p>
      </div>

      <section style={cardStyle}>
        <h2>1. Mercadoria e operação</h2>
        <div style={gridStyle}>
          <NCMPicker
            query={ncmQuery}
            options={ncmOptions}
            open={ncmOpen}
            loading={ncmLoading}
            onFocus={() => setNcmOpen(true)}
            onChange={(value) => { setNcmQuery(value); setNcmOpen(true); }}
            onSelect={selectNCM}
          />
          <label>Origem<select value={origin} onChange={e => setOrigin(e.target.value)} style={inputStyle}>{COUNTRY_CODES.map(code => <option key={code} value={code}>{countryNames.of(code) ?? code}</option>)}</select></label>
          <Field label="Data" value={date} onChange={setDate} type="date" />
          <Field label="Quantidade" value={quantity} onChange={setQuantity} />
          <Field label="FOB unit. US$" value={fobUnit} onChange={setFobUnit} />
          <Field label="Câmbio R$/US$" value={exchange} onChange={setExchange} />
          <Field label="Frete US$" value={freight} onChange={setFreight} />
          <Field label="Seguro US$" value={insurance} onChange={setInsurance} />
          <Field label="Armazenagem R$" value={storage} onChange={setStorage} />
          <Field label="ICMS normal %" value={icms} onChange={setIcms} />
          <label>TTD<select value={ttd} onChange={e => setTtd(e.target.value as TTD)} style={inputStyle}><option value="none">Sem TTD</option><option value="409">TTD 409</option><option value="410">TTD 410</option></select></label>
          <label>Destinação<select value={destination} onChange={e => setDestination(e.target.value as typeof destination)} style={inputStyle}><option value="commercial_resale">Revenda</option><option value="industrialization">Industrialização SC</option></select></label>
        </div>

        <div style={{ marginTop: 14, padding: 12, background: "#f6f6f6", borderRadius: 8 }}>
          Valor aduaneiro FOB estimado: <b>{money(customsValue)}</b>
        </div>

        <button onClick={calculate} disabled={loading} style={{ ...primaryButton, opacity: loading ? 0.65 : 1 }}>
          {loading ? "Calculando no servidor…" : "Calcular operação"}
        </button>

        {error && <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: "#fff1f1", color: "#8a1c1c" }}><b>Não foi possível calcular:</b><br />{error}</div>}
      </section>

      {federal && <section style={cardStyle}>
        <h2>2. Federal resolvido automaticamente</h2>
        <div style={metricsGrid}>
          <Metric label="II" value={`${federal.ii.rate}%`} detail="snapshot MDIC" />
          <Metric label="IPI" value={`${federal.ipi.rate}%`} detail="TIPI RFB" />
          <Metric label="PIS" value="2,10%" detail="motor federal" />
          <Metric label="COFINS" value="9,65%" detail="motor federal" />
        </div>
        <p style={{ color: "#666", fontSize: 13 }}>
          MDIC publicado em {federal.snapshot.mdicPublished ?? "não informado"}; TIPI atualizada em {federal.snapshot.tipiUpdated ?? "não informado"}.
        </p>
      </section>}

      {item && <section style={cardStyle}>
        <h2>3. Resultado SC + Federal</h2>
        <div style={metricsGrid}>
          <Metric label="Impostos normais" value={money(item.normalTaxTotal)} />
          <Metric label="Economia ICMS importação" value={money(item.importICMSSavings)} />
          <Metric label="Custo antes do benefício" value={money(item.landedCostBeforeBenefit)} />
          <Metric label="Custo após benefício" value={money(item.landedCostAfterBenefit)} />
        </div>
        <div style={{ marginTop: 16, padding: 14, border: "1px solid #eee", borderRadius: 10 }}>
          <b>Custo unitário final:</b> {money(item.landedCostPerUnitAfterBenefit)}<br />
          <b>Status:</b> {result.status}
        </div>
        {result.warnings?.length > 0 && <ul>{result.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>}
      </section>}

      {item && <section style={cardStyle}>
        <h2>4. Memória do cálculo</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, fontSize: 14 }}>
          <div>II: <b>{money(item.taxLines.ii.calculated)}</b> · {(item.taxLines.ii.rate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}%</div>
          <div>IPI: <b>{money(item.taxLines.ipi.calculated)}</b> · {(item.taxLines.ipi.rate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}%</div>
          <div>PIS: <b>{money(item.taxLines.pisImport.calculated)}</b> · {(item.taxLines.pisImport.rate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}%</div>
          <div>COFINS: <b>{money(item.taxLines.cofinsImport.calculated)}</b> · {(item.taxLines.cofinsImport.rate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}%</div>
          <div>ICMS: <b>{money(item.taxLines.icms.calculated)}</b> · {(item.taxLines.icms.rate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}%</div>
          <div>Despesas rateadas: <b>{money(item.totalAllocatedExpenses)}</b></div>
        </div>
      </section>}

      <div style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 10, fontSize: 13 }}>
        <b>Regra de segurança:</b> NCM sem tratamento federal inequívoco, conflito de alíquotas ou TTD não elegível bloqueiam o cálculo. Nenhuma alíquota é inventada.
      </div>
    </main>
  );
}

function NCMPicker({ query, options, open, loading, onFocus, onChange, onSelect }: {
  query: string;
  options: NCMOption[];
  open: boolean;
  loading: boolean;
  onFocus: () => void;
  onChange: (value: string) => void;
  onSelect: (option: NCMOption) => void;
}) {
  return <div style={{ position: "relative" }}>
    <label>NCM</label>
    <input type="text" value={query} onFocus={onFocus} onChange={e => onChange(e.target.value)} placeholder="Digite código ou descrição" style={inputStyle} autoComplete="off" />
    {open && <div style={dropdownStyle}>
      {loading && <div style={optionMuted}>Consultando tabela NCM oficial…</div>}
      {!loading && options.length === 0 && <div style={optionMuted}>Nenhuma NCM encontrada.</div>}
      {!loading && options.map(option => <button key={`${option.code}-${option.startDate ?? ""}`} type="button" onMouseDown={e => { e.preventDefault(); onSelect(option); }} style={optionStyle}>
        <b>{option.code}</b><span>{option.description}</span>
      </button>)}
    </div>}
  </div>;
}

function Field({ label, value, onChange, type = "number" }: { label: string; value: string | number; onChange: (value: any) => void; type?: string }) {
  return <label>{label}<input type={type} value={value} onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)} style={inputStyle} min={type === "number" ? 0 : undefined} /></label>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 14 }}>
    <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
    <strong style={{ display: "block", fontSize: 22, margin: "6px 0" }}>{value}</strong>
    {detail && <div style={{ fontSize: 11, color: "#666" }}>{detail}</div>}
  </div>;
}

const cardStyle: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 12, padding: 22, marginBottom: 20 };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 };
const metricsGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 };
const inputStyle: React.CSSProperties = { display: "block", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #ccc", borderRadius: 7, boxSizing: "border-box" };
const primaryButton: React.CSSProperties = { marginTop: 18, padding: "11px 18px", border: 0, borderRadius: 8, background: "#111", color: "#fff", fontWeight: 700, cursor: "pointer" };
const dropdownStyle: React.CSSProperties = { position: "absolute", zIndex: 20, left: 0, right: 0, top: "100%", marginTop: 4, maxHeight: 320, overflowY: "auto", background: "#fff", border: "1px solid #ccc", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.12)" };
const optionStyle: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", padding: "10px 12px", border: 0, borderBottom: "1px solid #eee", background: "#fff", cursor: "pointer", textAlign: "left" };
const optionMuted: React.CSSProperties = { padding: 12, color: "#666", fontSize: 13 };
