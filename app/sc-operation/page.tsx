"use client";

import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import DefenseCommercialExporterSelector from "../components/DefenseCommercialExporterSelector";

type TTD = "409" | "410" | "77" | "none";
type Destination = "commercial_resale" | "industrialization";
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
  ttd: TTD;
  destination: Destination;
  validConcession: boolean;
  importEntryInSC: boolean;
  industrializationInSC: boolean;
  sameNcmPositionAfterFractionation: boolean;
  decree2128Prohibited: boolean;
};

type ApiResult = any;
const today = new Date().toISOString().slice(0, 10);
const money = (value: number | null | undefined) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (value: number | null | undefined) => `${Number(value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

function makeItem(index: number): ItemState {
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
    ttd: "none",
    destination: "commercial_resale",
    validConcession: false,
    importEntryInSC: true,
    industrializationInSC: false,
    sameNcmPositionAfterFractionation: true,
    decree2128Prohibited: false,
  };
}

export default function SCOperationPage() {
  const [operationName, setOperationName] = useState("Nova importação");
  const [date, setDate] = useState(today);
  const [exchange, setExchange] = useState(5.5);
  const [freight, setFreight] = useState(1200);
  const [insurance, setInsurance] = useState(100);
  const [storage, setStorage] = useState(3500);
  const [otherBrl, setOtherBrl] = useState(0);
  const [transportMode, setTransportMode] = useState("maritime_long_course");
  const [declarationType, setDeclarationType] = useState("di");
  const [items, setItems] = useState<ItemState[]>([makeItem(1)]);
  const [result, setResult] = useState<ApiResult>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const merchandisePreview = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.fobUnit * exchange, 0),
    [items, exchange],
  );

  function updateItem<K extends keyof ItemState>(id: string, key: K, value: ItemState[K]) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
    setResult(null);
    setMessage("");
  }

  function addItem() {
    setItems((current) => [...current, makeItem(current.length + 1)]);
    setResult(null);
  }

  function removeItem(id: string) {
    setItems((current) => current.length > 1 ? current.filter((item) => item.id !== id) : current);
    setResult(null);
  }

  function buildPayload() {
    return {
      date,
      exchange,
      freight,
      insurance,
      storage,
      otherBrl,
      transportMode,
      declarationType,
      additions: items.length,
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
        exporter: item.exporter,
        ttd: item.ttd,
        destination: item.destination,
        validConcession: item.validConcession,
        importEntryInSC: item.importEntryInSC,
        industrializationInSC: item.industrializationInSC,
        sameNcmPositionAfterFractionation: item.sameNcmPositionAfterFractionation,
        decree2128Prohibited: item.decree2128Prohibited,
      })),
    };
  }

  async function calculate() {
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/sc-federal-calculate", {
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

  async function saveSimulation() {
    if (!result) return;
    setSaving(true);
    setMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        window.location.href = "/auth";
        return;
      }
      const response = await fetch("/api/sc-simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ name: operationName, input: buildPayload(), result }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar a simulação.");
      setMessage("Simulação salva no seu histórico.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a simulação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="wrap scTest" style={{ paddingTop: 36, paddingBottom: 70 }}>
      <header className="scHeader">
        <div>
          <div className="eyebrow dark">IMPORTAFÁCIL · MOTOR UNIFICADO</div>
          <h1>Uma importação. Vários itens. O mesmo motor automático.</h1>
          <p>II, IPI, PIS-Importação e COFINS-Importação são resolvidos automaticamente por NCM. O mesmo backend também avalia defesa comercial, regras de SC, TTD e custo nacionalizado por item.</p>
        </div>
        <a className="secondaryBtn" href="/dashboard">Meu painel</a>
      </header>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="resultTop">
          <div>
            <div className="eyebrow dark">1. OPERAÇÃO</div>
            <h2>Dados compartilhados</h2>
          </div>
          <div style={{ textAlign: "right" }}><small>Mercadorias</small><div style={{ fontWeight: 800, fontSize: 22 }}>{money(merchandisePreview)}</div></div>
        </div>
        <div className="fields four">
          <label>Nome da simulação<input value={operationName} onChange={(e) => setOperationName(e.target.value)} /></label>
          <label>Data da importação<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label>Câmbio (R$/US$)<input type="number" min="0" step="any" value={exchange} onChange={(e) => setExchange(Number(e.target.value))} /></label>
          <label>Frete internacional (US$)<input type="number" min="0" step="any" value={freight} onChange={(e) => setFreight(Number(e.target.value))} /></label>
          <label>Seguro internacional (US$)<input type="number" min="0" step="any" value={insurance} onChange={(e) => setInsurance(Number(e.target.value))} /></label>
          <label>Armazenagem (R$)<input type="number" min="0" step="any" value={storage} onChange={(e) => setStorage(Number(e.target.value))} /></label>
          <label>Outras despesas (R$)<input type="number" min="0" step="any" value={otherBrl} onChange={(e) => setOtherBrl(Number(e.target.value))} /></label>
          <label>Modal<select value={transportMode} onChange={(e) => setTransportMode(e.target.value)}><option value="maritime_long_course">Marítimo — longo curso</option><option value="cabotage">Marítimo — cabotagem</option><option value="air">Aéreo</option><option value="road">Rodoviário</option><option value="rail">Ferroviário</option><option value="not_informed">Não informado</option></select></label>
          <label>Declaração<select value={declarationType} onChange={(e) => setDeclarationType(e.target.value)}><option value="di">DI</option><option value="duimp">DUIMP</option></select></label>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="resultTop">
          <div><div className="eyebrow dark">2. ITENS</div><h2>Produtos da importação</h2><p>Não há campos manuais de II, IPI, PIS ou COFINS nesta tela.</p></div>
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
                <label>NCM<input inputMode="numeric" placeholder="40112090" value={item.ncm} onChange={(e) => updateItem(item.id, "ncm", e.target.value.replace(/\D/g, "").slice(0, 8))} /></label>
                <label>País de origem<input placeholder="Ex.: China" value={item.origin} onChange={(e) => updateItem(item.id, "origin", e.target.value)} /></label>
                <label>Quantidade<input type="number" min="0" step="any" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} /></label>
                <label>FOB unitário (US$)<input type="number" min="0" step="any" value={item.fobUnit} onChange={(e) => updateItem(item.id, "fobUnit", Number(e.target.value))} /></label>
                <label>Peso líquido (kg)<input type="number" min="0" step="any" value={item.weightKg} onChange={(e) => updateItem(item.id, "weightKg", Number(e.target.value))} /></label>
                <label>Volume (m³)<input type="number" min="0" step="any" value={item.volumeM3} onChange={(e) => updateItem(item.id, "volumeM3", Number(e.target.value))} /></label>
                <label>ICMS normal (%)<input type="number" min="0" max="99.99" step="any" value={item.icms} onChange={(e) => updateItem(item.id, "icms", Number(e.target.value))} /></label>
                <DefenseCommercialExporterSelector ncm={item.ncm} origin={item.origin} date={date} value={item.exporter} onChange={(value) => updateItem(item.id, "exporter", value)} />
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

        <button className="primary" type="button" onClick={calculate} disabled={loading} style={{ marginTop: 20 }}>{loading ? "Calculando..." : "Calcular operação"}</button>
        {message && <p style={{ marginTop: 14 }}>{message}</p>}
      </section>

      {result && <section className="card" style={{ marginBottom: 18 }}>
        <div className="resultTop">
          <div><div className="eyebrow dark">3. RESULTADO</div><h2>Custo nacionalizado</h2><p>Motor: {result.engine}</p></div>
          <div style={{ textAlign: "right" }}><small>Total com defesa comercial</small><div style={{ fontWeight: 900, fontSize: 28 }}>{money(result.calculation?.totalLandedCostIncludingDefense)}</div></div>
        </div>
        <div className="resultGrid" style={{ marginTop: 18 }}>
          <div className="miniCard"><small>Valor aduaneiro</small><b>{money(result.calculation?.totalCustomsValue)}</b></div>
          <div className="miniCard"><small>Tributos normais</small><b>{money(result.calculation?.totalNormalTaxes)}</b></div>
          <div className="miniCard"><small>Economia ICMS-importação</small><b>{money(result.calculation?.totalImportICMSSavings)}</b></div>
          <div className="miniCard"><small>Defesa comercial</small><b>{money(result.calculation?.defenseCommercialBrl)}</b></div>
        </div>
        <div style={{ overflowX: "auto", marginTop: 24 }}>
          <table className="importTable">
            <thead><tr><th>Item</th><th>NCM</th><th>II</th><th>IPI</th><th>PIS</th><th>COFINS</th><th>Defesa</th><th>Custo final</th><th>Unidade</th></tr></thead>
            <tbody>{(result.items ?? []).map((row: any) => <tr key={row.itemId}>
              <td><b>{row.name}</b><br/><small>{row.origin}</small></td>
              <td>{row.ncm}</td>
              <td>{pct(row.federal?.ii?.rate)}</td>
              <td>{pct(row.federal?.ipi?.rate)}</td>
              <td>{pct(row.federal?.pisImport?.rate)}</td>
              <td>{pct(row.federal?.cofinsImport?.rate)}</td>
              <td>{money(row.calculation?.defenseCommercialBrl)}</td>
              <td>{money(row.calculation?.landedCostIncludingDefense)}</td>
              <td>{money(row.calculation?.landedCostPerUnitIncludingDefense)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {(result.warnings?.length ?? 0) > 0 && <div className="infoNote" style={{ marginTop: 18 }}><b>Premissas e alertas</b><ul>{result.warnings.slice(0, 12).map((warning: string, index: number) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul></div>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button className="primary" type="button" onClick={saveSimulation} disabled={saving}>{saving ? "Salvando..." : "Salvar simulação"}</button>
          <button className="secondaryBtn" type="button" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
        </div>
      </section>}
    </main>
  );
}
