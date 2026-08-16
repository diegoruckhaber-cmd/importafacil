"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateSCMultiItemFinalCost } from "../../lib/sc-multi-item-final-cost-engine";
import { decideSCItem } from "../../lib/sc-decision-engine";
import { resolveSCBenefit } from "../../lib/sc-benefit-resolution";

type TTD = "none" | "409" | "410";
type NCMOption = { code: string; description: string; startDate?: string; endDate?: string };

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const countryNames = new Intl.DisplayNames(["pt-BR"], { type: "region" });

// ISO 3166-1 alpha-2. The UI displays the official country names in Portuguese.
const COUNTRY_CODES = [
  "AF","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BO","BQ","BA","BW","BV","BR","IO","BN","BG","BF","BI","CV","KH","CM","CA","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CD","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FK","FO","FJ","FI","FR","GF","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN","HK","HU","IS","IN","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","NF","MK","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","GB","US","UM","UY","UZ","VU","VE","VN","VG","VI","WF","EH","YE","ZM","ZW"
] as const;

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
  const [result, setResult] = useState<any>(null);
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
  }

  async function calculate() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(`/api/federal-resolve?ncm=${encodeURIComponent(ncm)}&date=${encodeURIComponent(date)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao resolver o Federal.");
      if (!data.ii?.automatic || data.ii.rate == null) throw new Error(`II não pode ser aplicado automaticamente: ${(data.ii?.warnings ?? []).join(" ")}`);
      if (!data.ipi?.automatic || data.ipi.rate == null) throw new Error(`IPI não pode ser aplicado automaticamente: ${(data.ipi?.warnings ?? []).join(" ")}`);
      setFederal(data);

      const itemId = "ITEM-001";
      let benefitsByItem: Record<string, ReturnType<typeof resolveSCBenefit>> = {};
      if (ttd !== "none") {
        const decision = decideSCItem({
          id: itemId,
          ttd: Number(ttd) as 409 | 410,
          destination,
          validConcession: true,
          importEntryInSC: true,
          sameNcmPositionAfterFractionation: true,
        });
        if (decision.decision !== "apply") throw new Error(`TTD ${ttd} bloqueado: ${decision.reasons.join(" ")}`);
        benefitsByItem[itemId] = resolveSCBenefit({
          ttd: Number(ttd) as 409 | 410,
          destination,
          normalOutputICMS: 0,
          taxableOutput: true,
          industrializationInSC: destination === "industrialization",
          preservesOriginalCharacteristics: true,
          sameNcmPosition: true,
          otherDeferment: false,
          paragraph23Or24: false,
          equivalentTaxableEventElection: false,
        });
      }

      const calculation = calculateSCMultiItemFinalCost({
        items: [{
          itemId,
          customsValue,
          quantity,
          weightKg: quantity,
          volumeM3: 1,
          iiRate: data.ii.rate,
          ipiRate: data.ipi.rate,
          pisImportRate: 2.1,
          cofinsImportRate: 9.65,
          icmsRate: icms,
          importDate: date as `${number}-${number}-${number}`,
          iiLegalFoundation: "MDIC official snapshot 2026-07",
        }],
        expenses: [
          { id: "FREIGHT", description: "Frete internacional", amount: freight * exchange, treatment: "customs_base", allocation: "item_value" },
          { id: "INSURANCE", description: "Seguro internacional", amount: insurance * exchange, treatment: "customs_base", allocation: "item_value" },
          { id: "STORAGE", description: "Armazenagem", amount: storage, treatment: "operational_cost", allocation: "item_value" },
        ],
        benefitsByItem,
      });
      setResult(calculation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível calcular.");
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
        <p style={{ color: "#666", maxWidth: 850 }}>Esta bancada consulta a tabela NCM oficial vigente do Classif/Siscomex e integra o resultado ao cálculo Federal + SC.</p>
      </div>

      <section style={cardStyle}>
        <h2>1. Mercadoria e operação</h2>
        <div style={gridStyle}>
          <NCMPicker query={ncmQuery} options={ncmOptions} open={ncmOpen} loading={ncmLoading} onFocus={() => setNcmOpen(true)} onChange={(value) => { setNcmQuery(value); setNcmOpen(true); }} onSelect={selectNCM} />
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
        <div style={{ marginTop: 14, padding: 12, background: "#f6f6f6", borderRadius: 8 }}>Valor aduaneiro FOB estimado: <b>{money(customsValue)}</b></div>
        <button onClick={calculate} disabled={loading} style={primaryButton}>{loading ? "Calculando…" : "Calcular operação"}</button>
        {error && <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: "#fff1f1", color: "#8a1c1c" }}>{error}</div>}
      </section>

      {federal && <section style={cardStyle}>
        <h2>2. Federal resolvido automaticamente</h2>
        <div style={metricsGrid}>
          <Metric label="II" value={`${federal.ii.rate}%`} detail="snapshot MDIC" />
          <Metric label="IPI" value={`${federal.ipi.rate}%`} detail="TIPI RFB" />
          <Metric label="PIS" value="2,10%" detail="motor federal" />
          <Metric label="COFINS" value="9,65%" detail="motor federal" />
        </div>
        <p style={{ color: "#666", fontSize: 13 }}>MDIC publicado em {federal.snapshot.mdicPublished}; TIPI atualizada em {federal.snapshot.tipiUpdated}. A NCM foi localizada sem conflito de alíquotas.</p>
      </section>}

      {item && <section style={cardStyle}>
        <h2>3. Resultado SC + Federal</h2>
        <div style={metricsGrid}>
          <Metric label="Impostos normais" value={money(item.normalTaxTotal)} />
          <Metric label="Economia ICMS importação" value={money(item.importICMSSavings)} />
          <Metric label="Custo antes do benefício" value={money(item.landedCostBeforeBenefit)} />
          <Metric label="Custo após benefício" value={money(item.landedCostAfterBenefit)} />
        </div>
        <div style={{ marginTop: 16, padding: 14, border: "1px solid #eee", borderRadius: 10 }}><b>Custo unitário final:</b> {money(item.landedCostPerUnitAfterBenefit)}<br /><b>Status:</b> {result.status}</div>
        {result.warnings.length > 0 && <ul>{result.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>}
      </section>}

      {item && <section style={cardStyle}>
        <h2>4. Memória do cálculo</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, fontSize: 14 }}>
          <div>II: <b>{money(item.taxLines.ii.valor)}</b> · {item.taxLines.ii.aliquota}%</div>
          <div>IPI: <b>{money(item.taxLines.ipi.valor)}</b> · {item.taxLines.ipi.aliquota}%</div>
          <div>PIS: <b>{money(item.taxLines.pisImport.valor)}</b> · {item.taxLines.pisImport.aliquota}%</div>
          <div>COFINS: <b>{money(item.taxLines.cofinsImport.valor)}</b> · {item.taxLines.cofinsImport.aliquota}%</div>
          <div>ICMS: <b>{money(item.taxLines.icms.valor)}</b> · {item.taxLines.icms.aliquota}%</div>
          <div>Despesas rateadas: <b>{money(item.totalAllocatedExpenses)}</b></div>
        </div>
      </section>}

      <div style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 10, fontSize: 13 }}><b>Importante:</b> o NCM é pesquisado na tabela oficial vigente. O sistema não deve inventar código nem aplicar alíquota quando houver ambiguidade.</div>
    </main>
  );
}

function NCMPicker({ query, options, open, loading, onFocus, onChange, onSelect }: { query: string; options: NCMOption[]; open: boolean; loading: boolean; onFocus: () => void; onChange: (value: string) => void; onSelect: (option: NCMOption) => void }) {
  return <div style={{ position: "relative" }}>
    <label>NCM</label>
    <input type="text" value={query} onFocus={onFocus} onChange={e => onChange(e.target.value)} placeholder="Digite código ou descrição" style={inputStyle} autoComplete="off" />
    {open && <div style={dropdownStyle}>
      {loading && <div style={optionMuted}>Consultando tabela NCM oficial…</div>}
      {!loading && options.map(option => <button key={`${option.code}-${option.startDate}`} type="button" onMouseDown={e => e.preventDefault()} onClick={() => onSelect(option)} style={optionStyle}><b>{option.code}</b><span>{option.description}</span></button>)}
      {!loading && options.length === 0 && <div style={optionMuted}>Nenhuma NCM encontrada.</div>}
    </div>}
  </div>;
}

function Field({ label, value, onChange, type = "number" }: { label: string; value: string | number; onChange: (value: any) => void; type?: string }) {
  return <label>{label}<input type={type} value={value} onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)} style={inputStyle} /></label>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 14 }}><div style={{ fontSize: 12, color: "#666" }}>{label}</div><strong style={{ display: "block", fontSize: 22, margin: "6px 0" }}>{value}</strong>{detail && <div style={{ fontSize: 11, color: "#666" }}>{detail}</div>}</div>;
}

const cardStyle: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 12, padding: 22, marginBottom: 20 };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 };
const metricsGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 };
const inputStyle: React.CSSProperties = { display: "block", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #ccc", borderRadius: 7, boxSizing: "border-box" };
const primaryButton: React.CSSProperties = { marginTop: 18, padding: "11px 18px", border: 0, borderRadius: 8, background: "#111", color: "#fff", fontWeight: 700, cursor: "pointer" };
const dropdownStyle: React.CSSProperties = { position: "absolute", zIndex: 20, left: 0, right: 0, top: "100%", maxHeight: 360, overflowY: "auto", background: "#fff", border: "1px solid #ccc", borderRadius: 8, boxShadow: "0 10px 24px rgba(0,0,0,.12)", marginTop: 4 };
const optionStyle: React.CSSProperties = { width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "10px 12px", border: 0, borderBottom: "1px solid #eee", background: "#fff", cursor: "pointer", textAlign: "left" };
const optionMuted: React.CSSProperties = { padding: 12, color: "#666", fontSize: 13 };
