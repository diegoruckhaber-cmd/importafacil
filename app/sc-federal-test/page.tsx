"use client";

import { useMemo, useState } from "react";
import { calculateSCMultiItemFinalCost } from "../../lib/sc-multi-item-final-cost-engine";
import { decideSCItem } from "../../lib/sc-decision-engine";
import { resolveSCBenefit } from "../../lib/sc-benefit-resolution";

type TTD = "none" | "409" | "410";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SCFederalTestPage() {
  const [ncm, setNcm] = useState("3208.10.20");
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
        if (decision.decision !== "apply") {
          throw new Error(`TTD ${ttd} bloqueado: ${decision.reasons.join(" ")}`);
        }
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
        <p style={{ color: "#666", maxWidth: 850 }}>Esta é a primeira bancada que junta o catálogo federal oficial, cálculo dos tributos, despesas/rateio e a camada de benefício SC. O objetivo é validar o fluxo antes de ampliar o sistema.</p>
      </div>

      <section style={cardStyle}>
        <h2>1. Mercadoria e operação</h2>
        <div style={gridStyle}>
          <Field label="NCM" value={ncm} onChange={setNcm} />
          <Field label="Origem" value={origin} onChange={setOrigin} />
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
        <div style={{ marginTop: 16, padding: 14, border: "1px solid #eee", borderRadius: 10 }}>
          <b>Custo unitário final:</b> {money(item.landedCostPerUnitAfterBenefit)}<br />
          <b>Status:</b> {result.status}
        </div>
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

      <div style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 10, fontSize: 13 }}><b>Importante:</b> este é um ambiente de teste. O cálculo só libera automaticamente o fluxo quando a NCM tem tratamento federal inequívoco e o TTD SC passa pelas travas do motor.</div>
    </main>
  );
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
