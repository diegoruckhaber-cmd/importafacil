"use client";

import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import DefenseCommercialExporterSelector from "../components/DefenseCommercialExporterSelector";
import NcmAutocomplete from "../components/NcmAutocomplete";
import CountryAutocomplete from "../components/CountryAutocomplete";
import { supabase } from "../../lib/supabase";
import { BRAZILIAN_UFS } from "../../lib/state-jurisdiction-registry";
import { SIMULATOR_FIELD_GUIDANCE as HELP } from "../../lib/simulator-field-guidance";

type TTD = "409" | "410" | "77" | "none";
type Destination = "commercial_resale" | "industrialization";
type TriState = "" | "yes" | "no";
type Status = "calculated" | "alert" | "requires_input" | "blocked" | "unsupported";

type Item = {
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

const today = new Date().toISOString().slice(0, 10);
const money = (value: number) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (value: number) => `${Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
const statusLabel: Record<Status, string> = {
  calculated: "Cálculo concluído",
  alert: "Cálculo concluído com alertas",
  requires_input: "Faltam informações para concluir",
  blocked: "Cálculo bloqueado por segurança",
  unsupported: "Operação fora do escopo automático",
};
const statusHelp: Record<Status, string> = {
  calculated: "O motor concluiu o pré-estudo com as premissas informadas.",
  alert: "O cálculo foi concluído, mas há pontos de atenção que precisam ser lidos antes da decisão.",
  requires_input: "Não trate este pré-estudo como resultado final. Complete ou valide as informações indicadas abaixo.",
  blocked: "O motor interrompeu a operação para evitar um cálculo tributário potencialmente incorreto.",
  unsupported: "Há tratamento fiscal ou classificação fora do catálogo automático desta versão.",
};
const statusStyle: Record<Status, { background: string; border: string; color: string }> = {
  calculated: { background: "#f2fbf5", border: "#b7e1c4", color: "#18794e" },
  alert: { background: "#fffaf0", border: "#f0d58a", color: "#9a6700" },
  requires_input: { background: "#fffaf0", border: "#f0d58a", color: "#9a6700" },
  blocked: { background: "#fff5f5", border: "#f1b7b7", color: "#b42318" },
  unsupported: { background: "#fff5f5", border: "#f1b7b7", color: "#b42318" },
};

const UF_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso",
  MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
  PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina",
  SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

const makeItem = (n: number, margin = 20): Item => ({
  id: `ITEM-${String(n).padStart(3, "0")}`,
  name: `Produto ${n}`,
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
});

const tri = (value: TriState) => value === "yes" ? true : value === "no" ? false : undefined;

export default function SimulationV2Page() {
  const next = useRef(2);
  const resultRef = useRef<HTMLElement | null>(null);
  const [name, setName] = useState("Pré-estudo de importação");
  const [date, setDate] = useState(today);
  const [destinationUf, setDestinationUf] = useState("SC");
  const [exchange, setExchange] = useState(5.5);
  const [freight, setFreight] = useState(1200);
  const [insurance, setInsurance] = useState(100);
  const [storage, setStorage] = useState(3500);
  const [otherBrl, setOtherBrl] = useState(0);
  const [transportMode, setTransportMode] = useState("maritime_long_course");
  const [declarationType, setDeclarationType] = useState("di");
  const [margin, setMargin] = useState(20);
  const [items, setItems] = useState<Item[]>([makeItem(1)]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

  const isSC = destinationUf === "SC";
  const merchandise = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.fobUnit * exchange, 0),
    [items, exchange],
  );

  const invalidate = () => {
    setResult(null);
    setMessage("");
    setSaveMessage("");
    setValidationIssues([]);
  };

  const update = <K extends keyof Item>(id: string, key: K, value: Item[K]) => {
    setItems((rows) => rows.map((row) => row.id === id ? { ...row, [key]: value } : row));
    invalidate();
  };

  const payload = () => ({
    scenarioName: name,
    date,
    destinationUf,
    exchange,
    freight,
    insurance,
    storage,
    otherBrl,
    transportMode,
    declarationType,
    additions: items.length,
    targetMarginPercent: margin,
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
      iiQuotaConfirmed: tri(item.iiQuotaConfirmed),
      aeronauticalEligible: tri(item.aeronauticalEligible),
      ttd: isSC ? item.ttd : "none",
      destination: item.destination,
      validConcession: isSC ? item.validConcession : false,
      importEntryInSC: isSC ? item.importEntryInSC : false,
      industrializationInSC: isSC ? item.industrializationInSC : false,
      sameNcmPositionAfterFractionation: isSC ? item.sameNcmPositionAfterFractionation : true,
      decree2128Prohibited: isSC ? item.decree2128Prohibited : false,
      targetMarginPercent: item.targetMarginPercent,
    })),
  });

  function validateInput() {
    const issues: string[] = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) issues.push("Informe uma data de importação válida.");
    if (!BRAZILIAN_UFS.includes(destinationUf as (typeof BRAZILIAN_UFS)[number])) issues.push("Selecione uma UF de destino válida.");
    if (!Number.isFinite(exchange) || exchange <= 0) issues.push("O câmbio deve ser maior que zero.");
    if (!Number.isFinite(freight) || freight < 0) issues.push("O frete internacional não pode ser negativo.");
    if (!Number.isFinite(insurance) || insurance < 0) issues.push("O seguro internacional não pode ser negativo.");
    if (!Number.isFinite(storage) || storage < 0) issues.push("A armazenagem não pode ser negativa.");
    if (!Number.isFinite(otherBrl) || otherBrl < 0) issues.push("Outras despesas não podem ser negativas.");
    if (!Number.isFinite(margin) || margin < 0 || margin >= 100) issues.push("A margem padrão deve estar entre 0% e menos de 100%.");
    if (!items.length) issues.push("Inclua pelo menos um item.");

    items.forEach((item, index) => {
      const label = `Item ${index + 1}`;
      if (!/^\d{8}$/.test(item.ncm)) issues.push(`${label}: informe uma NCM com exatamente 8 dígitos.`);
      if (!item.origin.trim()) issues.push(`${label}: informe o país de origem.`);
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) issues.push(`${label}: a quantidade deve ser maior que zero.`);
      if (!Number.isFinite(item.fobUnit) || item.fobUnit < 0) issues.push(`${label}: o FOB unitário não pode ser negativo.`);
      if (!Number.isFinite(item.weightKg) || item.weightKg < 0) issues.push(`${label}: o peso não pode ser negativo.`);
      if (!Number.isFinite(item.volumeM3) || item.volumeM3 < 0) issues.push(`${label}: o volume não pode ser negativo.`);
      if (!Number.isFinite(item.targetMarginPercent) || item.targetMarginPercent < 0 || item.targetMarginPercent >= 100) {
        issues.push(`${label}: a margem alvo deve estar entre 0% e menos de 100%.`);
      }
      if (isSC && (!Number.isFinite(item.icms) || item.icms < 0 || item.icms >= 100)) {
        issues.push(`${label}: informe uma alíquota normal de ICMS SC válida.`);
      }
    });

    const totalWeight = items.reduce((sum, item) => sum + Number(item.weightKg || 0), 0);
    if (freight > 0 && totalWeight <= 0) {
      issues.push("Informe peso líquido em pelo menos um item para ratear o frete internacional.");
    }
    return issues;
  }

  async function calculate() {
    const issues = validateInput();
    setValidationIssues(issues);
    setMessage("");
    setResult(null);
    if (issues.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/simulation-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível calcular.");
      setResult(data);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível calcular.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!result) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        location.href = "/auth";
        return;
      }
      const response = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode: "v2", name, input: payload(), result }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar.");
      location.href = `/simulacao/${data.id}`;
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  const status = (result?.status || "calculated") as Status;
  const resultStyle = statusStyle[status];

  return (
    <main className="simulatorPage">
      <div className="simulatorTopbar">
        <div className="wrap simulatorNav">
          <a className="logo" href="/">ImportaFácil</a>
          <div className="simulatorNavLinks">
            <a href="/">Início</a>
            <a href="/dashboard">Meu painel</a>
            <a className="navCta" href="/upgrade">PRO</a>
          </div>
        </div>
      </div>

      <section className="simulatorHero" aria-labelledby="simulator-title">
        <div className="wrap simulatorHeroInner">
          <div>
            <div className="eyebrow">SIMULADOR DE IMPORTAÇÃO</div>
            <h1 id="simulator-title">Simule sua importação antes de fechar a compra.</h1>
            <p>
              Informe a operação e veja tributos, despesas, custo nacionalizado,
              custo por unidade e preço alvo em uma visão única.
            </p>
            <div className="proof">
              <span>✓ 27 UFs cobertas</span>
              <span>✓ Tributos federais automáticos</span>
              <span>✓ Resultado auditável</span>
            </div>
          </div>
          <div className="simulatorHeroCard">
            <small>RESUMO DA OPERAÇÃO</small>
            <b>{name || "Nova simulação"}</b>
            <div className="simHeroMetric"><span>Mercadorias</span><strong>{money(merchandise)}</strong></div>
            <div className="simHeroMetric"><span>Destino</span><strong>{destinationUf} · {UF_NAMES[destinationUf]}</strong></div>
            <div className="simHeroMetric"><span>Itens</span><strong>{items.length}</strong></div>
          </div>
        </div>
      </section>

      <div className="wrap simulatorWorkspace">

      <aside className="simulatorGuide" aria-label="Como preencher a simulação">
        <div>
          <div className="eyebrow dark">COMO PREENCHER</div>
          <b>Comece pelos dados comerciais que você já conhece.</b>
        </div>
        <ol>
          <li><strong>Operação:</strong> destino, câmbio e despesas gerais.</li>
          <li><strong>Mercadorias:</strong> NCM, origem, quantidade, FOB e peso.</li>
          <li><strong>Tratamentos específicos:</strong> abra as opções avançadas apenas quando se aplicarem.</li>
        </ol>
        <p>Se você não souber um dado, evite estimar no escuro. O simulador informa o que precisa ser validado antes de concluir.</p>
      </aside>

      {validationIssues.length > 0 && (
        <div role="alert" style={{ ...statusStyle.requires_input, border: `1px solid ${statusStyle.requires_input.border}`, borderRadius: 14, padding: 16, marginBottom: 18 }}>
          <b>Revise os dados antes de calcular</b>
          <ul style={{ marginBottom: 0 }}>{validationIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
        </div>
      )}

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="resultTop">
          <div>
            <div className="eyebrow dark">1. DADOS DA OPERAÇÃO</div>
            <h2>Comece pelas premissas principais</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <small>Mercadorias</small>
            <div style={{ fontWeight: 800, fontSize: 22 }}>{money(merchandise)}</div>
          </div>
        </div>

        <div className="fields four">
          <Field label="Nome do pré-estudo"><input value={name} onChange={(e) => { setName(e.target.value); invalidate(); }} /></Field>
          <Field label="Data"><input type="date" value={date} onChange={(e) => { setDate(e.target.value); invalidate(); }} /></Field>
          <Field label="UF de destino" hint={HELP.destinationUf}>
            <select
              aria-label="UF de destino"
              value={destinationUf}
              onChange={(e) => {
                const uf = e.target.value;
                setDestinationUf(uf);
                setItems((rows) => rows.map((row) => uf === "SC" ? row : { ...row, ttd: "none" }));
                invalidate();
              }}
            >
              {BRAZILIAN_UFS.map((uf) => <option key={uf} value={uf}>{uf} — {UF_NAMES[uf]}</option>)}
            </select>
          </Field>
          <Num label="Câmbio R$/US$" hint={HELP.exchange} value={exchange} set={setExchange} invalidate={invalidate} />
          <Num label="Frete internacional US$" hint={HELP.freight} value={freight} set={setFreight} invalidate={invalidate} />
          <Num label="Seguro internacional US$" hint={HELP.insurance} value={insurance} set={setInsurance} invalidate={invalidate} />
          <Num label="Armazenagem R$" hint={HELP.storage} value={storage} set={setStorage} invalidate={invalidate} />
          <Num label="Outras despesas R$" value={otherBrl} set={setOtherBrl} invalidate={invalidate} />
          <Field label="Margem alvo padrão %" hint={HELP.margin}>
            <input
              type="number"
              min="0"
              max="99.99"
              value={margin}
              onChange={(e) => {
                const value = Number(e.target.value);
                setMargin(value);
                setItems((rows) => rows.map((row) => ({ ...row, targetMarginPercent: value })));
                invalidate();
              }}
            />
          </Field>
          <Field label="Modal" hint={HELP.transportMode}>
            <select value={transportMode} onChange={(e) => { setTransportMode(e.target.value); invalidate(); }}>
              <option value="maritime_long_course">Marítimo — longo curso</option>
              <option value="cabotage">Cabotagem</option>
              <option value="air">Aéreo</option>
              <option value="road">Rodoviário</option>
              <option value="rail">Ferroviário</option>
              <option value="not_informed">Não informado</option>
            </select>
          </Field>
          <Field label="Declaração" hint={HELP.declaration}>
            <select value={declarationType} onChange={(e) => { setDeclarationType(e.target.value); invalidate(); }}>
              <option value="di">DI</option>
              <option value="duimp">DUIMP</option>
            </select>
          </Field>
        </div>

        <div
          data-state-scope={isSC ? "full" : "general_rate_only"}
          style={{
            marginTop: 18,
            padding: 15,
            borderRadius: 12,
            border: "1px solid #dbe5ff",
            background: "#f8faff",
            color: "#344054",
            lineHeight: 1.5,
          }}
        >
          <b>{isSC ? "Santa Catarina · regras estaduais específicas disponíveis" : `${destinationUf} · regra geral de ICMS`}</b>
          <div style={{ marginTop: 5, fontSize: 13 }}>
            {isSC
              ? "Se sua operação utilizar um TTD, você poderá informar os dados específicos no item."
              : "Para este estado, a simulação utiliza a alíquota geral de ICMS aplicável à importação. Benefícios e regimes especiais não são presumidos automaticamente."}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="resultTop">
          <div>
            <div className="eyebrow dark">2. MERCADORIAS</div>
            <h2>O que você vai importar?</h2>
            <p>Informe os dados comerciais de cada produto. As alíquotas federais são buscadas pelo sistema a partir da NCM.</p>
          </div>
          <button className="secondaryBtn" type="button" onClick={() => {
            const n = next.current++;
            setItems((rows) => [...rows, makeItem(n, margin)]);
            invalidate();
          }}>+ Adicionar item</button>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          {items.map((item, index) => (
            <article key={item.id} className="miniCard" style={{ padding: 20 }}>
              <div className="resultTop">
                <b>{item.id} · Item {index + 1}</b>
                {items.length > 1 && <button type="button" className="secondaryBtn" onClick={() => {
                  setItems((rows) => rows.filter((row) => row.id !== item.id));
                  invalidate();
                }}>Excluir</button>}
              </div>

              <div className="fields four" style={{ marginTop: 14 }}>
                <Text label="Descrição" value={item.name} set={(value) => update(item.id, "name", value)} />
                <NcmAutocomplete hint={HELP.ncm} value={item.ncm} onChange={(value) => update(item.id, "ncm", value)} />
                <CountryAutocomplete hint={HELP.origin} value={item.origin} onChange={(value) => update(item.id, "origin", value)} />
                <ItemNum label="Quantidade" value={item.quantity} set={(value) => update(item.id, "quantity", value)} />
                <ItemNum label="FOB unitário US$" hint={HELP.fobUnit} value={item.fobUnit} set={(value) => update(item.id, "fobUnit", value)} />
                <ItemNum label="Peso líquido kg" hint={HELP.weight} value={item.weightKg} set={(value) => update(item.id, "weightKg", value)} />
                <ItemNum label="Volume m³" value={item.volumeM3} set={(value) => update(item.id, "volumeM3", value)} />
                {isSC && <ItemNum label="Alíquota ICMS normal SC %" value={item.icms} set={(value) => update(item.id, "icms", value)} />}
                <ItemNum label="Margem alvo %" value={item.targetMarginPercent} set={(value) => update(item.id, "targetMarginPercent", value)} />
                <Field label="Destinação" hint={HELP.destination}>
                  <select value={item.destination} onChange={(e) => update(item.id, "destination", e.target.value as Destination)}>
                    <option value="commercial_resale">Revenda/comercialização</option>
                    <option value="industrialization">Industrialização</option>
                  </select>
                </Field>
              </div>

              <details className="advancedPanel">
                <summary>Opções avançadas e tratamentos específicos</summary>
                <p>Use estes campos apenas quando a sua operação tiver enquadramentos ou informações adicionais.</p>
                <div className="fields four advancedFields">
                  <DefenseCommercialExporterSelector ncm={item.ncm} origin={item.origin} date={date} value={item.exporter} onChange={(value) => update(item.id, "exporter", value)} />
                  <Text label="EX do II" value={item.iiExCode} set={(value) => update(item.id, "iiExCode", value)} />
                  <Text label="EX do IPI" value={item.ipiExCode} set={(value) => update(item.id, "ipiExCode", value)} />
                  <Field label="Quota II">
                    <select value={item.iiQuotaConfirmed} onChange={(e) => update(item.id, "iiQuotaConfirmed", e.target.value as TriState)}>
                      <option value="">Não informado</option>
                      <option value="yes">Confirmada</option>
                      <option value="no">Não elegível</option>
                    </select>
                  </Field>
                  <Field label="Enquadramento aeronáutico">
                    <select value={item.aeronauticalEligible} onChange={(e) => update(item.id, "aeronauticalEligible", e.target.value as TriState)}>
                      <option value="">Não informado</option>
                      <option value="yes">Elegível</option>
                      <option value="no">Não elegível</option>
                    </select>
                  </Field>
                  {isSC && (
                    <Field label="Regime tributário SC">
                      <select value={item.ttd} onChange={(e) => update(item.id, "ttd", e.target.value as TTD)}>
                        <option value="none">Sem TTD — tributação normal</option>
                        <option value="77">TTD 77</option>
                        <option value="409">TTD 409</option>
                        <option value="410">TTD 410</option>
                      </select>
                    </Field>
                  )}
                </div>
              </details>

              {isSC && item.ttd !== "none" && (
                <div className="checks" style={{ marginTop: 14 }}>
                  <Check label="Ato concessivo válido" checked={item.validConcession} set={(value) => update(item.id, "validConcession", value)} />
                  <Check label="Entrada/importação em SC" checked={item.importEntryInSC} set={(value) => update(item.id, "importEntryInSC", value)} />
                  {item.destination === "industrialization" && <Check label="Industrialização em SC" checked={item.industrializationInSC} set={(value) => update(item.id, "industrializationInSC", value)} />}
                  <Check label="Mantém posição NCM após fracionamento" checked={item.sameNcmPositionAfterFractionation} set={(value) => update(item.id, "sameNcmPositionAfterFractionation", value)} />
                  <Check label="Há vedação conhecida no Decreto SC 2.128/2009" checked={item.decree2128Prohibited} set={(value) => update(item.id, "decree2128Prohibited", value)} />
                </div>
              )}
            </article>
          ))}
        </div>

        <button className="primary" onClick={calculate} disabled={loading} style={{ marginTop: 20 }}>
          {loading ? "Calculando..." : "Calcular importação"}
        </button>
        {message && <p role="alert" style={{ marginTop: 14, color: "#b42318" }}>{message}</p>}
      </section>

      {result && (
        <section className="card simulationResult" ref={resultRef}>
          <div
            className="resultStatusBanner"
            data-simulation-status={status}
            style={{ background: resultStyle.background, borderColor: resultStyle.border, color: resultStyle.color }}
          >
            <div className="resultStatusIcon" aria-hidden="true">✓</div>
            <div>
              <b>{statusLabel[status]}</b>
              <p>{statusHelp[status]}</p>
            </div>
          </div>

          <div className="resultHeader">
            <div>
              <div className="eyebrow dark">3. RESULTADO</div>
              <h2>{name}</h2>
              <p className="resultContext">
                Destino <strong>{result.operation?.destinationUf || destinationUf}</strong>
                <span>•</span>
                Tratamento estadual: <strong>{isSC ? "regras específicas de SC" : "regra geral de ICMS"}</strong>
              </p>
            </div>
            {result.summary && (
              <div className="capitalCard">
                <small>Capital necessário</small>
                <strong>{money(result.summary.capitalRequiredBrl)}</strong>
                <span>estimativa para nacionalizar a operação</span>
              </div>
            )}
          </div>

          {result.summary && (
            <>
              <div className="financialHighlights">
                <div className="financialHighlight">
                  <small>Custo nacionalizado</small>
                  <strong>{money(result.summary.landedCostBrl)}</strong>
                </div>
                <div className="financialHighlight">
                  <small>Receita alvo</small>
                  <strong>{money(result.summary.targetRevenueBrl)}</strong>
                </div>
                <div className="financialHighlight positive">
                  <small>Lucro estimado</small>
                  <strong>{money(result.summary.estimatedProfitBrl)}</strong>
                </div>
              </div>

              <div className="costBreakdown">
                <div>
                  <span>Mercadorias</span>
                  <strong>{money(result.summary.merchandiseBrl)}</strong>
                </div>
                <div>
                  <span>Tributos de importação</span>
                  <strong>{money(result.summary.importTaxesBrl)}</strong>
                </div>
                <div>
                  <span>Defesa comercial</span>
                  <strong>{money(result.summary.defenseCommercialBrl)}</strong>
                </div>
              </div>

              <section className="resultSection">
                <div className="resultSectionHead">
                  <div>
                    <small>POR ITEM</small>
                    <h3>Tributos e preço alvo</h3>
                  </div>
                  <span>{result.items.length} {result.items.length === 1 ? "item" : "itens"}</span>
                </div>

                <div className="resultTableWrap">
                  <table className="importTable resultTable">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>NCM</th>
                        <th>II</th>
                        <th>IPI</th>
                        <th>ICMS</th>
                        <th>Custo/un.</th>
                        <th>Margem</th>
                        <th>Preço alvo/un.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((row: any) => (
                        <tr key={row.itemId}>
                          <td>
                            <strong>{row.name}</strong>
                            <small className="itemStatus">{statusLabel[row.status as Status] || row.status}</small>
                          </td>
                          <td><span className="ncmPill">{row.ncm}</span></td>
                          <td>{pct(row.federal?.ii?.rate)}</td>
                          <td>{pct(row.federal?.ipi?.rate)}</td>
                          <td>{pct(row.state?.icmsGeneralRate ?? row.calculation?.icmsNormalRate)}</td>
                          <td>{money(row.commercial?.breakEvenPricePerUnitBrl)}</td>
                          <td>{pct(row.commercial?.targetMarginPercent)}</td>
                          <td><strong>{money(row.commercial?.targetSalePricePerUnitBrl)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {result.attentionPoints?.length > 0 && (
            <section className="resultSection attentionSection">
              <div className="resultSectionHead">
                <div>
                  <small>VALIDAÇÕES</small>
                  <h3>Pontos de atenção</h3>
                </div>
                <span>{result.attentionPoints.length}</span>
              </div>
              <div className="attentionList">
                {result.attentionPoints.map((point: string, index: number) => (
                  <div className="attentionItem" key={index}>
                    <div className="attentionNumber">{index + 1}</div>
                    <div>{renderAttentionPoint(point)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <details className="technicalDetails resultTechnicalDetails">
            <summary>Detalhes técnicos do cálculo</summary>
            <p>
              Escopo interno: {result.jurisdiction?.scope || (isSC ? "full" : "general_rate_only")}
              {" · "}Motor: {result.engine}
            </p>
          </details>

          {saveMessage && (
            <div className="saveError" role="alert">
              <div>
                <strong>Não foi possível salvar esta simulação.</strong>
                <span>{saveMessage}</span>
              </div>
              {saveMessage.includes("limite") && <a href="/upgrade">Conhecer o PRO</a>}
            </div>
          )}

          <div className="resultActions">
            <button className="primary" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : status === "calculated" || status === "alert" ? "Salvar no histórico" : "Salvar pré-estudo"}
            </button>
            <button className="secondaryBtn" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
          </div>
        </section>
      )}

      </div>
      <footer className="simulatorFooter">
        <div className="wrap">
          <span>ImportaFácil · beta controlado</span>
          <span><a href="/privacidade">Privacidade</a> · <a href="/termos">Termos de uso</a></span>
        </div>
      </footer>
    </main>
  );
}


function renderAttentionPoint(point: string) {
  const parts = point.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      return <a key={index} href={part} target="_blank" rel="noreferrer">Abrir fonte oficial</a>;
    }
    return <span key={index}>{part}</span>;
  });
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label>{label}{children}{hint && <small className="fieldHint">{hint}</small>}</label>;
}

function Num({ label, hint, value, set, invalidate }: { label: string; hint?: string; value: number; set: (value: number) => void; invalidate: () => void }) {
  return <Field label={label} hint={hint}><input type="number" min="0" step="any" value={value} onChange={(e) => { set(Number(e.target.value)); invalidate(); }} /></Field>;
}

function Text({ label, hint, value, set }: { label: string; hint?: string; value: string; set: (value: string) => void }) {
  return <Field label={label} hint={hint}><input value={value} onChange={(e) => set(e.target.value)} /></Field>;
}

function ItemNum({ label, hint, value, set }: { label: string; hint?: string; value: number; set: (value: number) => void }) {
  return <Field label={label} hint={hint}><input type="number" min="0" step="any" value={value} onChange={(e) => set(Number(e.target.value))} /></Field>;
}

function Check({ label, checked, set }: { label: string; checked: boolean; set: (value: boolean) => void }) {
  return <label><input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} />{label}</label>;
}
