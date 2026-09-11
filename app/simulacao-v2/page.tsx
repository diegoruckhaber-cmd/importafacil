"use client";

import { useMemo, useRef, useState } from "react";
import DefenseCommercialExporterSelector from "../components/DefenseCommercialExporterSelector";

type TTD = "409" | "410" | "77" | "none";
type Destination = "commercial_resale" | "industrialization";
type TriState = "" | "yes" | "no";
type SimulationStatus = "calculated" | "alert" | "requires_input" | "blocked" | "unsupported";

type ItemState = {
  id: string;
  name: string;
  ncm: string;
  origin: string;
  quantity: number;
  fobUnit: number;
  weightKg: number;
  volumeM3: number;
  icms: number;
  exporter: string;
  iiExCode: string;
  ipiExCode: string;
  iiQuotaConfirmed: TriState;
  aeronauticalEligible: TriState;
  ttd: TTD;
  destination: Destination;
  validConcession: boolean;
  importEntryInSC: boolean;
  industrializationInSC: boolean;
  sameNcmPositionAfterFractionation: boolean;
  decree2128Prohibited: boolean;
  targetMarginPercent: number;
};

type ApiResult = any;
const today = new Date().toISOString().slice(0, 10);
const money = (value: number | null | undefined) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (value: number | null | undefined) => `${Number(value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

const statusLabel: Record<SimulationStatus, string> = {
  calculated: "Calculado",
  alert: "Calculado com alerta",
  requires_input: "Requer validação",
  blocked: "Bloqueado",
  unsupported: "Não suportado automaticamente",
};

function makeItem(index: number, margin = 20): ItemState {
  return {
    id: `ITEM-${String(index).padStart(3, "0")}`,
    name: `Produto ${index}`,
    ncm: "",
    origin: "",
    quantity: 1000,
    fobUnit: 10,
    weightKg: 0,
    volumeM3: 0,
    icms: 17,
    exporter: "",
    iiExCode: "",
    ipiExCode: "",
    iiQuotaConfirmed: "",
    aeronauticalEligible: "",
    ttd: "none",
    destination: "commercial_resale",
    validConcession: false,
    importEntryInSC: true,
    industrializationInSC: false,
    sameNcmPositionAfterFractionation: true,
    decree2128Prohibited: false,
    targetMarginPercent: margin,
  };
}

const triStateToBoolean = (value: TriState) => value === "yes" ? true : value === "no" ? false : undefined;

export default function SimulationV2Page() {
  const nextItemNumber = useRef(2);
  const [scenarioName, setScenarioName] = useState("Pré-estudo de importação");
  const [date, setDate] = useState(today);
  const [exchange, setExchange] = useState(5.5);
  const [freight, setFreight] = useState(1200);
  const [insurance, setInsurance] = useState(100);
  const [storage, setStorage] = useState(3500);
  const [otherBrl, setOtherBrl] = useState(0);
  const [transportMode, setTransportMode] = useState("maritime_long_course");
  const [declarationType, setDeclarationType] = useState("di");
  const [targetMarginPercent, setTargetMarginPercent] = useState(20);
  const [items, setItems] = useState<ItemState[]>([makeItem(1, 20)]);
  const [result, setResult] = useState<ApiResult>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const merchandisePreview = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.fobUnit * exchange, 0),
    [items, exchange],
  );

  function invalidate() {
    setResult(null);
    setMessage("");
  }

  function updateItem<K extends keyof ItemState>(id: string, key: K, value: ItemState[K]) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
    invalidate();
  }

  function addItem() {
    const index = nextItemNumber.current++;
    setItems((current) => [...current, makeItem(index, targetMarginPercent)]);
    invalidate();
  }

  function removeItem(id: string) {
    setItems((current) => current.length > 1 ? current.filter((item) => item.id !== id) : current);
    invalidate();
  }

  function applyMarginToAll(value: number) {
    setTargetMarginPercent(value);
    setItems((current) => current.map((item) => ({ ...item, targetMarginPercent: value })));
    invalidate();
  }

  function buildPayload() {
    return {
      scenarioName,
      date,
      exchange,
      freight,
      insurance,
      storage,
      otherBrl,
      transportMode,
      declarationType,
      additions: items.length,
      targetMarginPercent,
      items: items.map((item) => ({
        itemId: item.id,
        name: item.name,
        ncm: item.ncm,
        origin: item.origin,
        quantity: item.quantity,
        weightKg: item.weightKg,
        volumeM3: item.volumeM3,
        fobUnit: item.fobUnit,
        icms: item.icms,
        exporter: item.exporter || undefined,
        iiExCode: item.iiExCode || undefined,
        ipiExCode: item.ipiExCode || undefined,
        iiQuotaConfirmed: triStateToBoolean(item.iiQuotaConfirmed),
        aeronauticalEligible: triStateToBoolean(item.aeronauticalEligible),
        ttd: item.ttd,
        destination: item.destination,
        validConcession: item.validConcession,
        importEntryInSC: item.importEntryInSC,
        industrializationInSC: item.industrializationInSC,
        sameNcmPositionAfterFractionation: item.sameNcmPositionAfterFractionation,
        decree2128Prohibited: item.decree2128Prohibited,
        targetMarginPercent: item.targetMarginPercent,
      })),
    };
  }

  async function calculate() {
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/simulation-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível calcular a operação.");
      setResult(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível calcular a operação.");
    } finally {
      setLoading(false);
    }
  }

  const status = (result?.status ?? "calculated") as SimulationStatus;

  return (
    <main className="wrap scTest" style={{ paddingTop: 36, paddingBottom: 70 }}>
      <header className="scHeader">
        <div>
          <div className="eyebrow dark">IMPORTAFÁCIL · SIMULATION V2</div>
          <h1>Da NCM ao custo e à decisão comercial, item por item.</h1>
          <p>A V2 usa o motor unificado já validado para resolver tributos federais, regras de SC, defesa comercial e custo nacionalizado. A camada comercial transforma o custo em preço de equilíbrio, preço para margem alvo e lucro estimado sem recriar regra fiscal.</p>
        </div>
        <a className="secondaryBtn" href="/dashboard">Meu painel</a>
      </header>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="resultTop">
          <div><div className="eyebrow dark">1. OPERAÇÃO</div><h2>Premissas compartilhadas</h2></div>
          <div style={{ textAlign: "right" }}><small>Mercadorias</small><div style={{ fontWeight: 800, fontSize: 22 }}>{money(merchandisePreview)}</div></div>
        </div>
        <div className="fields four">
          <label>Nome do pré-estudo<input value={scenarioName} onChange={(e) => { setScenarioName(e.target.value); invalidate(); }} /></label>
          <label>Data da importação<input type="date" value={date} onChange={(e) => { setDate(e.target.value); invalidate(); }} /></label>
          <label>Câmbio (R$/US$)<input type="number" min="0" step="any" value={exchange} onChange={(e) => { setExchange(Number(e.target.value)); invalidate(); }} /></label>
          <label>Frete internacional (US$)<input type="number" min="0" step="any" value={freight} onChange={(e) => { setFreight(Number(e.target.value)); invalidate(); }} /></label>
          <label>Seguro internacional (US$)<input type="number" min="0" step="any" value={insurance} onChange={(e) => { setInsurance(Number(e.target.value)); invalidate(); }} /></label>
          <label>Armazenagem (R$)<input type="number" min="0" step="any" value={storage} onChange={(e) => { setStorage(Number(e.target.value)); invalidate(); }} /></label>
          <label>Outras despesas (R$)<input type="number" min="0" step="any" value={otherBrl} onChange={(e) => { setOtherBrl(Number(e.target.value)); invalidate(); }} /></label>
          <label>Margem alvo padrão (%)<input type="number" min="0" max="99.99" step="any" value={targetMarginPercent} onChange={(e) => applyMarginToAll(Number(e.target.value))} /></label>
          <label>Modal<select value={transportMode} onChange={(e) => { setTransportMode(e.target.value); invalidate(); }}><option value="maritime_long_course">Marítimo — longo curso</option><option value="cabotage">Marítimo — cabotagem</option><option value="air">Aéreo</option><option value="road">Rodoviário</option><option value="rail">Ferroviário</option><option value="not_informed">Não informado</option></select></label>
          <label>Declaração<select value={declarationType} onChange={(e) => { setDeclarationType(e.target.value); invalidate(); }}><option value="di">DI</option><option value="duimp">DUIMP</option></select></label>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="resultTop">
          <div><div className="eyebrow dark">2. ITENS</div><h2>Produtos da importação</h2><p>II, IPI, PIS-Importação e COFINS-Importação não são digitados manualmente.</p></div>
          <button className="secondaryBtn" type="button" onClick={addItem}>+ Adicionar item</button>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          {items.map((item, index) => (
            <article key={item.id} className="miniCard" style={{ padding: 20 }}>
              <div className="resultTop">
                <div><b>{item.id}</b><span style={{ marginLeft: 10, color: "#777" }}>Item {index + 1}</span></div>
                {items.length > 1 && <button className="secondaryBtn" type="button" onClick={() => removeItem(item.id)}>Excluir</button>}
              </div>

              <div className="fields four" style={{ marginTop: 14 }}>
                <label>Descrição<input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} /></label>
                <label>NCM<input inputMode="numeric" placeholder="Ex.: 32081020" value={item.ncm} onChange={(e) => updateItem(item.id, "ncm", e.target.value.replace(/\D/g, "").slice(0, 8))} /></label>
                <label>País de origem<input placeholder="Ex.: China" value={item.origin} onChange={(e) => updateItem(item.id, "origin", e.target.value)} /></label>
                <label>Quantidade<input type="number" min="0" step="any" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} /></label>
                <label>FOB unitário (US$)<input type="number" min="0" step="any" value={item.fobUnit} onChange={(e) => updateItem(item.id, "fobUnit", Number(e.target.value))} /></label>
                <label>Peso líquido (kg)<input type="number" min="0" step="any" value={item.weightKg} onChange={(e) => updateItem(item.id, "weightKg", Number(e.target.value))} /></label>
                <label>Volume (m³)<input type="number" min="0" step="any" value={item.volumeM3} onChange={(e) => updateItem(item.id, "volumeM3", Number(e.target.value))} /></label>
                <label>ICMS normal (%)<input type="number" min="0" max="99.99" step="any" value={item.icms} onChange={(e) => updateItem(item.id, "icms", Number(e.target.value))} /></label>
                <label>Margem alvo do item (%)<input type="number" min="0" max="99.99" step="any" value={item.targetMarginPercent} onChange={(e) => updateItem(item.id, "targetMarginPercent", Number(e.target.value))} /></label>
                <DefenseCommercialExporterSelector ncm={item.ncm} origin={item.origin} date={date} value={item.exporter} onChange={(value) => updateItem(item.id, "exporter", value)} />
                <label>EX do II <span style={{ fontWeight: 400, fontSize: 12 }}>(se aplicável)</span><input value={item.iiExCode} onChange={(e) => updateItem(item.id, "iiExCode", e.target.value)} /></label>
                <label>EX do IPI <span style={{ fontWeight: 400, fontSize: 12 }}>(se aplicável)</span><input value={item.ipiExCode} onChange={(e) => updateItem(item.id, "ipiExCode", e.target.value)} /></label>
                <label>Elegibilidade de quota do II<select value={item.iiQuotaConfirmed} onChange={(e) => updateItem(item.id, "iiQuotaConfirmed", e.target.value as TriState)}><option value="">Não informado</option><option value="yes">Confirmada</option><option value="no">Não elegível</option></select></label>
                <label>Enquadramento aeronáutico<select value={item.aeronauticalEligible} onChange={(e) => updateItem(item.id, "aeronauticalEligible", e.target.value as TriState)}><option value="">Não informado</option><option value="yes">Elegível</option><option value="no">Não elegível</option></select></label>
                <label>Regime SC<select value={item.ttd} onChange={(e) => updateItem(item.id, "ttd", e.target.value as TTD)}><option value="none">Sem TTD — normal</option><option value="77">TTD 77</option><option value="409">TTD 409</option><option value="410">TTD 410</option></select></label>
                <label>Destinação<select value={item.destination} onChange={(e) => updateItem(item.id, "destination", e.target.value as Destination)}><option value="commercial_resale">Revenda/comercialização</option><option value="industrialization">Industrialização</option></select></label>
              </div>

              {item.ttd !== "none" && <div className="checks" style={{ marginTop: 14 }}>
                <label><input type="checkbox" checked={item.validConcession} onChange={(e) => updateItem(item.id, "validConcession", e.target.checked)} /> Ato concessivo válido</label>
                <label><input type="checkbox" checked={item.importEntryInSC} onChange={(e) => updateItem(item.id, "importEntryInSC", e.target.checked)} /> Entrada/importação em SC</label>
                {item.destination === "industrialization" && <label><input type="checkbox" checked={item.industrializationInSC} onChange={(e) => updateItem(item.id, "industrializationInSC", e.target.checked)} /> Industrialização em SC</label>}
                <label><input type="checkbox" checked={item.sameNcmPositionAfterFractionation} onChange={(e) => updateItem(item.id, "sameNcmPositionAfterFractionation", e.target.checked)} /> Mantém a mesma posição NCM após fracionamento</label>
                <label><input type="checkbox" checked={item.decree2128Prohibited} onChange={(e) => updateItem(item.id, "decree2128Prohibited", e.target.checked)} /> Há vedação conhecida pelo Decreto SC 2.128/2009</label>
              </div>}
            </article>
          ))}
        </div>

        <button className="primary" type="button" onClick={calculate} disabled={loading} style={{ marginTop: 20 }}>{loading ? "Calculando..." : "Calcular Simulation V2"}</button>
        {message && <p style={{ marginTop: 14 }}>{message}</p>}
      </section>

      {result && <section className="card" style={{ marginBottom: 18 }}>
        <div className="resultTop">
          <div>
            <div className="eyebrow dark">3. RESULTADO</div>
            <h2>{statusLabel[status]}</h2>
            <p>Contrato: {result.contract} · Motor: {result.engine}</p>
          </div>
          {result.summary && <div style={{ textAlign: "right" }}><small>Capital estimado até a nacionalização</small><div style={{ fontWeight: 900, fontSize: 28 }}>{money(result.summary.capitalRequiredBrl)}</div></div>}
        </div>

        {result.summary && <>
          <div className="resultGrid" style={{ marginTop: 18 }}>
            <div className="miniCard"><small>Mercadorias</small><b>{money(result.summary.merchandiseBrl)}</b></div>
            <div className="miniCard"><small>Tributos de importação</small><b>{money(result.summary.importTaxesBrl)}</b></div>
            <div className="miniCard"><small>Defesa comercial</small><b>{money(result.summary.defenseCommercialBrl)}</b></div>
            <div className="miniCard"><small>Custo nacionalizado</small><b>{money(result.summary.landedCostBrl)}</b></div>
            <div className="miniCard"><small>Receita na margem alvo</small><b>{money(result.summary.targetRevenueBrl)}</b></div>
            <div className="miniCard"><small>Lucro estimado do lote</small><b>{money(result.summary.estimatedProfitBrl)}</b></div>
          </div>

          <div style={{ overflowX: "auto", marginTop: 24 }}>
            <table className="importTable">
              <thead><tr><th>Item</th><th>Status</th><th>NCM</th><th>II</th><th>IPI</th><th>Custo/un.</th><th>Margem</th><th>Preço alvo/un.</th><th>Lucro lote</th></tr></thead>
              <tbody>{(result.items ?? []).map((row: any) => <tr key={row.itemId}>
                <td><b>{row.name}</b><br/><small>{row.origin}</small></td>
                <td>{statusLabel[(row.status ?? "calculated") as SimulationStatus]}</td>
                <td>{row.ncm}</td>
                <td>{pct(row.federal?.ii?.rate)}</td>
                <td>{pct(row.federal?.ipi?.rate)}</td>
                <td>{money(row.commercial?.breakEvenPricePerUnitBrl)}</td>
                <td>{pct(row.commercial?.targetMarginPercent)}</td>
                <td>{money(row.commercial?.targetSalePricePerUnitBrl)}</td>
                <td>{money(row.commercial?.estimatedProfitBrl)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p style={{ marginTop: 12, fontSize: 13 }}>Preço de equilíbrio e preço para margem alvo são calculados sobre o custo nacionalizado da importação, antes dos tributos e efeitos da venda.</p>
        </>}

        {(result.attentionPoints?.length ?? 0) > 0 && <div className="infoNote" style={{ marginTop: 18 }}>
          <b>Pontos de atenção</b>
          <ul>{result.attentionPoints.slice(0, 20).map((warning: string, index: number) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul>
        </div>}

        {!result.summary && <div className="infoNote" style={{ marginTop: 18 }}>
          <b>O cálculo monetário não foi concluído automaticamente.</b>
          <p>Resolva os pontos indicados acima e execute novamente. A V2 não assume alíquota ou benefício quando o enquadramento depende de informação adicional.</p>
        </div>}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button className="secondaryBtn" type="button" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
          <button className="secondaryBtn" type="button" onClick={() => { setResult(null); setMessage(""); }}>Editar premissas</button>
        </div>
      </section>}
    </main>
  );
}
