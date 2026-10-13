"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import DefenseCommercialExporterSelector from "../components/DefenseCommercialExporterSelector";
import NcmAutocomplete from "../components/NcmAutocomplete";
import CountryAutocomplete from "../components/CountryAutocomplete";
import { supabase } from "../../lib/supabase";
import { BRAZILIAN_UFS } from "../../lib/state-jurisdiction-registry";
import { SIMULATOR_FIELD_GUIDANCE as HELP } from "../../lib/simulator-field-guidance";
import MobileBottomNav from "../components/MobileBottomNav";
import { isEuropeanUnionOrigin } from "../../lib/mercosur-eu-import-preference";
import ItemPreflightAlerts from "../components/ItemPreflightAlerts";
import FederalIpiTreatmentSelector from "../components/FederalIpiTreatmentSelector";
import { downloadSimulationReportPdf } from "../../lib/simulation-report-pdf";

type TTD = "409" | "410" | "77" | "none";
type Destination = "commercial_resale" | "industrialization" | "use_consumption";
type CompanyRegime = "" | "lucro-real" | "lucro-presumido" | "simples-nacional";
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
  ipiBaseConfirmed: boolean;
  iiQuotaConfirmed: TriState;
  aeronauticalEligible: TriState;
  mercosurEuPreferenceRequested: TriState;
  mercosurEuOriginProofConfirmed: TriState;
  mercosurEuPreferentialIiRate: number;
  mercosurEuQuotaRequired: TriState;
  mercosurEuQuotaAvailable: TriState;
  ttd: TTD;
  destination: Destination;
  validConcession: boolean;
  importEntryInSC: boolean;
  industrializationInSC: boolean;
  sameNcmPositionAfterFractionation: boolean;
  decree2128Prohibited: boolean;
  targetMarginPercent: number;
};

const localDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};
const today = localDate();
const money = (value: number) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (value: number) => `${Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
const taxLineRatePct = (line: any) => {
  if (!line) return null;
  if (Number.isFinite(Number(line.displayRate))) return Number(line.displayRate);
  if (Number.isFinite(Number(line.rate))) return Number(line.rate) * 100;
  return null;
};
const sameRateLabel = (rows: any[], getter: (row: any) => number | null | undefined) => {
  const values = rows.map(getter).filter((value): value is number => Number.isFinite(Number(value))).map((value) => Number(Number(value).toFixed(6)));
  const unique = [...new Set(values)];
  if (!unique.length) return "";
  if (unique.length === 1) return `(${pct(unique[0])})`;
  return "(alíquotas por item)";
};
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
  ipiBaseConfirmed: false,
  iiQuotaConfirmed: "",
  aeronauticalEligible: "",
  mercosurEuPreferenceRequested: "",
  mercosurEuOriginProofConfirmed: "",
  mercosurEuPreferentialIiRate: 0,
  mercosurEuQuotaRequired: "",
  mercosurEuQuotaAvailable: "",
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

const cachedSupabaseAccessToken = () => {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem("sb-fagjbhhmbpdsmoyjcood-auth-token");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return String(parsed?.access_token || parsed?.session?.access_token || parsed?.currentSession?.access_token || "");
  } catch {
    return "";
  }
};


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
  const [companyTaxRegime, setCompanyTaxRegime] = useState<CompanyRegime>("");
  const [icmsTaxpayer, setIcmsTaxpayer] = useState<TriState>("yes");
  const [items, setItems] = useState<Item[]>([makeItem(1)]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
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
    companyTaxRegime: companyTaxRegime || "nao-informado",
    icmsTaxpayer: tri(icmsTaxpayer),
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
      ipiBaseConfirmed: item.ipiBaseConfirmed,
      iiQuotaConfirmed: tri(item.iiQuotaConfirmed),
      aeronauticalEligible: tri(item.aeronauticalEligible),
      mercosurEuPreferenceRequested: tri(item.mercosurEuPreferenceRequested),
      mercosurEuOriginProofConfirmed: tri(item.mercosurEuOriginProofConfirmed),
      mercosurEuPreferentialIiRate: item.mercosurEuPreferentialIiRate,
      mercosurEuQuotaRequired: tri(item.mercosurEuQuotaRequired),
      mercosurEuQuotaAvailable: tri(item.mercosurEuQuotaAvailable),
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
    if (!companyTaxRegime) issues.push("Selecione o regime tributário da empresa.");
    if (!icmsTaxpayer) issues.push("Informe se a empresa é contribuinte do ICMS.");
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

  function focusTreatment(itemId: string, action: "ii" | "ipi" | "mercosur_eu" | "exporter") {
    const details = document.getElementById(`advanced-${itemId}`) as HTMLDetailsElement | null;
    if (details) details.open = true;
    requestAnimationFrame(() => {
      const target = document.querySelector(`[data-treatment-field="${itemId}-${action}"] select, [data-treatment-field="${itemId}-${action}"] input`) as HTMLElement | null;
      target?.focus();
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
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
    if (!result || saving) return;
    setSaving(true);
    setSaveMessage("");
    const controller = new AbortController();
    let timeoutId: number | null = null;
    try {
      const timeout = (ms: number, message: string) => new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          controller.abort();
          reject(new Error(message));
        }, ms);
      });

      let accessToken = cachedSupabaseAccessToken();
      if (!accessToken) {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          timeout(5000, "Não foi possível validar sua sessão em tempo hábil. Tente novamente."),
        ]);
        if (timeoutId != null) { window.clearTimeout(timeoutId); timeoutId = null; }
        accessToken = String(sessionResult.data.session?.access_token || "");
      }

      if (!accessToken) {
        setSaving(false);
        location.href = "/auth";
        return;
      }

      const request = fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ mode: "v2", name, input: payload(), result }),
        signal: controller.signal,
      }).then(async (response) => {
        const raw = await response.text();
        let data: any = {};
        try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
        return { response, data };
      });

      const { response, data } = await Promise.race([
        request,
        timeout(10000, "O salvamento ultrapassou 10 segundos e foi interrompido. Tente novamente."),
      ]);
      if (timeoutId != null) { window.clearTimeout(timeoutId); timeoutId = null; }

      if (!response.ok) throw new Error(data.error || "Não foi possível salvar.");
      if (!data.id) throw new Error("A simulação foi processada, mas o histórico não retornou um identificador válido.");

      setSaveMessage("Simulação salva com sucesso. Abrindo o histórico...");
      setSaving(false);
      window.setTimeout(() => { location.assign(`/simulacao/${data.id}`); }, 350);
    } catch (error) {
      const aborted = controller.signal.aborted;
      setSaveMessage(aborted
        ? "O salvamento demorou mais que o esperado e foi interrompido. Você pode tentar novamente sem recarregar a página."
        : error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      if (timeoutId != null) window.clearTimeout(timeoutId);
      setSaving(false);
    }
  }

  async function downloadPdf() {
    if (!result) return;
    setPdfGenerating(true);
    setMessage("");
    try {
      await downloadSimulationReportPdf({
        name,
        input: payload(),
        result,
        created_at: new Date().toISOString(),
      });
    } catch {
      setMessage("Não foi possível gerar o PDF personalizado. Tente novamente.");
    } finally {
      setPdfGenerating(false);
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
            <a href="/simulacao-v2">Nova simulação</a>
            <a href="/comparar">Comparar</a>
            <a href="/dashboard">Minhas simulações</a>
            <a className="navCta" href="/upgrade">PRO</a>
          </div>
        </div>
      </div>

      <section className="simulatorHero" aria-labelledby="simulator-title">
        <div className="wrap simulatorHeroInner">
          <div className="simulatorHeroCopy">
            <div className="eyebrow dark">NOVA SIMULAÇÃO</div>
            <h1 id="simulator-title">Nova simulação de importação</h1>
            <p>Preencha os dados da operação para estimar custos, tributos e o desembolso bruto da sua importação.</p>
            <div className="simulatorProgress" aria-label="Etapas da simulação">
              <div className="simulatorProgressStep active"><span>1</span><b>Operação</b></div>
              <div className="simulatorProgressStep"><span>2</span><b>Mercadoria</b></div>
              <div className="simulatorProgressStep"><span>3</span><b>Custos</b></div>
              <div className="simulatorProgressStep"><span>4</span><b>Revisão</b></div>
            </div>
          </div>
          <div className="simulatorHeroCard">
            <div className="simulatorHeroCardTitle">
              <span className="simulatorHeroIcon" aria-hidden="true">▦</span>
              <div><small>RESUMO ESTIMADO</small><b>{name || "Nova simulação"}</b></div>
            </div>
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
              {BRAZILIAN_UFS.map((uf) => <option key={uf} value={uf}>{uf} - {UF_NAMES[uf]}</option>)}
            </select>
          </Field>
          <Num label="Câmbio R$/US$" hint={HELP.exchange} value={exchange} set={setExchange} invalidate={invalidate} step={0.01} />
          <Num label="Frete internacional US$" hint={HELP.freight} value={freight} set={setFreight} invalidate={invalidate} step={100} />
          <Num label="Seguro internacional US$" hint={HELP.insurance} value={insurance} set={setInsurance} invalidate={invalidate} step={50} />
          <Num label="Armazenagem R$" hint={HELP.storage} value={storage} set={setStorage} invalidate={invalidate} step={100} />
          <Num label="Outras despesas R$" value={otherBrl} set={setOtherBrl} invalidate={invalidate} step={100} />
          <Field label="Margem alvo padrão %" hint={HELP.margin}>
            <NumericInput
              value={margin}
              min={0}
              max={99.99}
              step={1}
              onChange={(value) => {
                setMargin(value);
                setItems((rows) => rows.map((row) => ({ ...row, targetMarginPercent: value })));
                invalidate();
              }}
            />
          </Field>
          <Field label="Regime tributário da empresa">
            <select value={companyTaxRegime} onChange={(e) => { setCompanyTaxRegime(e.target.value as CompanyRegime); invalidate(); }}>
              <option value="">Selecione...</option>
              <option value="lucro-real">Lucro Real</option>
              <option value="lucro-presumido">Lucro Presumido</option>
              <option value="simples-nacional">Simples Nacional</option>
            </select>
          </Field>
          <Field label="Empresa contribuinte de ICMS?">
            <select value={icmsTaxpayer} onChange={(e) => { setIcmsTaxpayer(e.target.value as TriState); invalidate(); }}>
              <option value="">Não informado</option>
              <option value="yes">Sim</option>
              <option value="no">Não</option>
            </select>
          </Field>
          <Field label="Modal" hint={HELP.transportMode}>
            <select value={transportMode} onChange={(e) => { setTransportMode(e.target.value); invalidate(); }}>
              <option value="maritime_long_course">Marítimo - longo curso</option>
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
                <ItemNum label="Quantidade" step={1} value={item.quantity} set={(value) => update(item.id, "quantity", value)} />
                <ItemNum label="FOB unitário US$" hint={HELP.fobUnit} step={0.1} value={item.fobUnit} set={(value) => update(item.id, "fobUnit", value)} />
                <ItemNum label="Peso líquido kg" hint={HELP.weight} step={10} value={item.weightKg} set={(value) => update(item.id, "weightKg", value)} />
                <ItemNum label="Volume m³" step={0.1} value={item.volumeM3} set={(value) => update(item.id, "volumeM3", value)} />
                {isSC && <ItemNum label="Alíquota ICMS normal SC %" step={0.1} value={item.icms} set={(value) => update(item.id, "icms", value)} />}
                <ItemNum label="Margem alvo %" step={1} max={99.99} value={item.targetMarginPercent} set={(value) => update(item.id, "targetMarginPercent", value)} />
                <Field label="Aplicação da mercadoria" hint={HELP.destination}>
                  <select value={item.destination} onChange={(e) => {
                    const value = e.target.value as Destination;
                    setItems((rows) => rows.map((row) => row.id === item.id
                      ? { ...row, destination: value, ...(value === "use_consumption" ? { ttd: "none", industrializationInSC: false } : {}) }
                      : row));
                    invalidate();
                  }}>
                    <option value="commercial_resale">Revenda/comercialização</option>
                    <option value="industrialization">Industrialização</option>
                    <option value="use_consumption">Uso e consumo</option>
                  </select>
                </Field>
              </div>

              <ItemPreflightAlerts ncm={item.ncm} origin={item.origin} date={date} onResolve={(action) => focusTreatment(item.id, action)} />

              <details className="advancedPanel" id={`advanced-${item.id}`}>
                <summary>Opções avançadas e tratamentos específicos</summary>
                <p>Use estes campos apenas quando a sua operação tiver enquadramentos ou informações adicionais.</p>
                <div className="fields four advancedFields">
                  <div data-treatment-field={`${item.id}-exporter`}><DefenseCommercialExporterSelector ncm={item.ncm} origin={item.origin} date={date} value={item.exporter} onChange={(value) => update(item.id, "exporter", value)} /></div>
                  <div data-treatment-field={`${item.id}-ii`}><Text label="EX do II" value={item.iiExCode} set={(value) => update(item.id, "iiExCode", value)} /></div>
                  <div data-treatment-field={`${item.id}-ipi`}>
                    <FederalIpiTreatmentSelector
                      ncm={item.ncm}
                      date={date}
                      exCode={item.ipiExCode}
                      baseConfirmed={item.ipiBaseConfirmed}
                      onChange={({ exCode, baseConfirmed }) => {
                        setItems((rows) => rows.map((row) => row.id === item.id ? { ...row, ipiExCode: exCode, ipiBaseConfirmed: baseConfirmed } : row));
                        invalidate();
                      }}
                    />
                  </div>
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
                  {date >= "2026-05-01" && isEuropeanUnionOrigin(item.origin) && (
                    <>
                      <div data-treatment-field={`${item.id}-mercosur_eu`}><Field label="Preferência Mercosul-UE">
                        <select value={item.mercosurEuPreferenceRequested} onChange={(e) => update(item.id, "mercosurEuPreferenceRequested", e.target.value as TriState)}>
                          <option value="">Não confirmado - manter TEC</option>
                          <option value="yes">Simular preferência</option>
                          <option value="no">Não aplicar preferência</option>
                        </select>
                      </Field></div>
                      <Field label="Prova de origem preferencial">
                        <select value={item.mercosurEuOriginProofConfirmed} onChange={(e) => update(item.id, "mercosurEuOriginProofConfirmed", e.target.value as TriState)}>
                          <option value="">Não confirmado</option>
                          <option value="yes">Confirmada</option>
                          <option value="no">Não disponível</option>
                        </select>
                      </Field>
                      <ItemNum label="II preferencial final %" step={0.1} max={100} value={item.mercosurEuPreferentialIiRate} set={(value) => update(item.id, "mercosurEuPreferentialIiRate", value)} />
                      <Field label="Cota tarifária aplicável?">
                        <select value={item.mercosurEuQuotaRequired} onChange={(e) => update(item.id, "mercosurEuQuotaRequired", e.target.value as TriState)}>
                          <option value="">Não informado</option>
                          <option value="no">Não</option>
                          <option value="yes">Sim</option>
                        </select>
                      </Field>
                      {item.mercosurEuQuotaRequired === "yes" && (
                        <Field label="Cota disponível/confirmada?">
                          <select value={item.mercosurEuQuotaAvailable} onChange={(e) => update(item.id, "mercosurEuQuotaAvailable", e.target.value as TriState)}>
                            <option value="">Não confirmado</option>
                            <option value="yes">Sim</option>
                            <option value="no">Não</option>
                          </select>
                        </Field>
                      )}
                      <div className="euPreferenceNote">
                        Origem UE detectada. O ImportaFácil só reduz o II quando a preferência, a prova de origem e a alíquota final aplicável estiverem confirmadas. Caso contrário, mantém a TEC vigente.
                        <a href="https://www.gov.br/siscomex/pt-br/acordos-comerciais/preferencias-tarifarias" target="_blank" rel="noreferrer">Consultar preferência oficial ↗</a>
                      </div>
                    </>
                  )}
                  {isSC && (
                    <Field label="Regime tributário SC">
                      <select value={item.ttd} onChange={(e) => update(item.id, "ttd", e.target.value as TTD)}>
                        <option value="none">Sem TTD - tributação normal</option>
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
            <div className="resultStatusIcon" aria-hidden="true">{status === "calculated" || status === "alert" ? "✓" : "!"}</div>
            <div>
              <b>{statusLabel[status]}</b>
              <p>{statusHelp[status]}</p>
            </div>
          </div>

          <div className="resultHeader">
            <div>
              <div className="eyebrow dark">{status === "calculated" || status === "alert" ? "3. RESULTADO" : "3. PRÉ-ANÁLISE"}</div>
              <h2>{name}</h2>
              <p className="resultContext">
                Destino <strong>{result.operation?.destinationUf || destinationUf}</strong>
                <span>•</span>
                Tratamento estadual: <strong>{isSC ? "regras específicas de SC" : "regra geral de ICMS"}</strong>
              </p>
            </div>
            {result.summary && (
              <div className="capitalCard">
                <small>Desembolso total estimado</small>
                <strong>{money(result.summary.capitalRequiredBrl)}</strong>
                <span>valor bruto estimado para concluir a importação</span>
              </div>
            )}
          </div>

          {!result.summary && result.completion && (
            <div className="incompleteProgress">
              <div>
                <small>PROGRESSO DA SIMULAÇÃO</small>
                <strong>{result.completion.completedItems} de {result.completion.totalItems} {result.completion.totalItems === 1 ? "item calculado" : "itens calculados"}</strong>
                <span>O total consolidado ficará disponível quando todas as pendências forem resolvidas.</span>
              </div>
              <div className="incompleteProgressCount">{result.completion.pendingItems} pendente{result.completion.pendingItems === 1 ? "" : "s"}</div>
            </div>
          )}

          {result.summary && (
            <>
              <div className="financialHighlights">
                <div className="financialHighlight">
                  <small>Desembolso bruto da importação</small>
                  <strong>{money(result.summary.grossDisbursementBrl ?? result.summary.landedCostBrl)}</strong>
                </div>
                <div className="financialHighlight">
                  <small>Custo econômico líquido</small>
                  {result.summary.economicNetCostBrl == null
                    ? <><strong className="pendingMetric">A validar</strong><span>faltam condições para concluir os créditos tributários</span></>
                    : <><strong>{money(result.summary.economicNetCostBrl)}</strong><span>após créditos recuperáveis estimados</span></>}
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

              <div className="economicCostNotice">
                <div>
                  <b>Desembolso bruto ≠ custo econômico líquido</b>
                  <p>O desembolso mostra o caixa necessário para importar. O custo econômico líquido deduz os créditos recuperáveis estimados conforme regime tributário, aplicação da mercadoria e condição de contribuinte do ICMS.</p>
                </div>
                <span>{result.summary.recoverableTaxCreditsBrl == null ? "Créditos fiscais: a validar" : `Créditos estimados: ${money(result.summary.recoverableTaxCreditsBrl)}`}</span>
              </div>

              <div className="costBreakdown detailed">
                <div><span>Mercadorias</span><strong>{money(result.summary.merchandiseBrl)}</strong></div>
                <div><span>Frete internacional</span><strong>{money(result.summary.freightBrl)}</strong></div>
                <div><span>Seguro internacional</span><strong>{money(result.summary.insuranceBrl)}</strong></div>
                <div><span>II <em>{sameRateLabel(result.items, (row) => row.federal?.ii?.rate)}</em></span><strong>{money(result.summary.iiBrl)}</strong></div>
                <div><span>IPI <em>{sameRateLabel(result.items, (row) => row.federal?.ipi?.rate)}</em></span><strong>{money(result.summary.ipiBrl)}</strong></div>
                <div><span>PIS-Importação <em>{sameRateLabel(result.items, (row) => taxLineRatePct(row.calculation?.taxLines?.pisImport))}</em></span><strong>{money(result.summary.pisImportBrl)}</strong></div>
                <div><span>Cofins-Importação <em>{sameRateLabel(result.items, (row) => taxLineRatePct(row.calculation?.taxLines?.cofinsImport))}</em></span><strong>{money(result.summary.cofinsImportBrl)}</strong></div>
                <div><span>ICMS-Importação <em>{sameRateLabel(result.items, (row) => row.state?.icmsGeneralRate ?? row.calculation?.icmsNormalRate ?? taxLineRatePct(row.calculation?.taxLines?.icms))}</em></span><strong>{money(result.summary.icmsImportBrl)}</strong></div>
                <div><span>AFRMM</span><strong>{money(result.summary.afrmmBrl)}</strong></div>
                <div><span>Taxa Siscomex</span><strong>{money(result.summary.siscomexBrl)}</strong></div>
                <div><span>Armazenagem</span><strong>{money(result.summary.storageBrl)}</strong></div>
                <div><span>Outras despesas</span><strong>{money(result.summary.otherExpensesBrl)}</strong></div>
                <div><span>Defesa comercial</span><strong>{money(result.summary.defenseCommercialBrl)}</strong></div>
                <div><span>Crédito ICMS estimado</span><strong>- {money(result.summary.icmsCreditBrl)}</strong></div>
                <div><span>Crédito IPI estimado</span><strong>- {money(result.summary.ipiCreditBrl)}</strong></div>
                <div><span>Crédito PIS-Importação estimado</span><strong>- {money(result.summary.pisImportCreditBrl)}</strong></div>
                <div><span>Crédito Cofins-Importação estimado</span><strong>- {money(result.summary.cofinsImportCreditBrl)}</strong></div>
                <div className="costBreakdownTotal"><span>Desembolso bruto estimado</span><strong>{money(result.summary.grossDisbursementBrl)}</strong></div>
                {result.summary.economicNetCostBrl != null && <div className="costBreakdownTotal net"><span>Custo econômico líquido estimado</span><strong>{money(result.summary.economicNetCostBrl)}</strong></div>}
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
                        <th>PIS-Imp.</th>
                        <th>Cofins-Imp.</th>
                        <th>ICMS</th>
                        <th>Defesa comercial</th>
                        <th>Custo/un.</th>
                        <th>Preço alvo/un.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((row: any) => (
                        <tr key={row.itemId}>
                          <td>
                            <strong>{row.name}</strong>
                            <small className="itemStatus">{statusLabel[row.status as Status] || row.status}</small>
                            {(() => {
                              const sourceItem = items.find((item) => item.id === row.itemId);
                              if (!sourceItem || date < "2026-05-01" || !isEuropeanUnionOrigin(sourceItem.origin)) return null;
                              const applied = row.federal?.mercosurEuPreference?.appliedPreference === true;
                              return <small className={`preferenceStatus ${applied ? "applied" : "pending"}`}>{applied ? `Mercosul-UE aplicado · II ${pct(row.federal?.ii?.rate)}` : "Preferência Mercosul-UE identificada - não aplicada"}</small>;
                            })()}
                          </td>
                          <td><span className="ncmPill">{row.ncm}</span></td>
                          <td>{pct(row.federal?.ii?.rate)}</td>
                          <td>{pct(row.federal?.ipi?.rate)}</td>
                          <td>{taxLineRatePct(row.calculation?.taxLines?.pisImport) == null ? "-" : pct(taxLineRatePct(row.calculation?.taxLines?.pisImport)!)}</td>
                          <td>{taxLineRatePct(row.calculation?.taxLines?.cofinsImport) == null ? "-" : pct(taxLineRatePct(row.calculation?.taxLines?.cofinsImport)!)}</td>
                          <td>{pct(row.state?.icmsGeneralRate ?? row.calculation?.icmsNormalRate ?? taxLineRatePct(row.calculation?.taxLines?.icms))}</td>
                          <td>{row.federal?.defenseCommercial?.rate == null ? "-" : `${Number(row.federal.defenseCommercial.rate).toLocaleString("pt-BR",{maximumFractionDigits:2})}${row.federal.defenseCommercial.unit === "AD_VALOREM" ? "%" : " " + String(row.federal.defenseCommercial.unit || "")}`}</td>
                          <td>{money(row.commercial?.breakEvenPricePerUnitBrl)}</td>
                          <td><strong>{money(row.commercial?.targetSalePricePerUnitBrl)}</strong><small className="itemStatus">Margem {pct(row.commercial?.targetMarginPercent)}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {!result.summary && result.items?.length > 0 && (
            <section className="resultSection partialResultSection">
              <div className="resultSectionHead">
                <div>
                  <small>POR ITEM</small>
                  <h3>Resultado parcial e pendências</h3>
                </div>
                <span>{result.completion?.completedItems || 0} calculado(s) · {result.completion?.pendingItems || 0} pendente(s)</span>
              </div>
              <div className="partialResultNotice">
                Valores por item são exibidos somente quando puderam ser calculados com segurança. Não existe total consolidado enquanto houver pendências.
              </div>
              <div className="resultTableWrap">
                <table className="importTable resultTable">
                  <thead><tr><th>Item</th><th>NCM</th><th>II</th><th>IPI</th><th>Status</th><th>Custo/un. parcial</th></tr></thead>
                  <tbody>
                    {result.items.map((row: any) => {
                      const sourceItem = items.find((item) => item.id === row.itemId);
                      const euPotential = sourceItem && date >= "2026-05-01" && isEuropeanUnionOrigin(sourceItem.origin);
                      const euApplied = row.federal?.mercosurEuPreference?.appliedPreference === true;
                      return (
                        <tr key={row.itemId}>
                          <td>
                            <strong>{row.name}</strong>
                            {row.partial && <small className="itemStatus">Estimativa parcial isolada</small>}
                            {euPotential && <small className={`preferenceStatus ${euApplied ? "applied" : "pending"}`}>{euApplied ? "Mercosul-UE aplicado" : "Preferência Mercosul-UE identificada - ainda não aplicada ao resultado"}</small>}
                          </td>
                          <td><span className="ncmPill">{row.ncm}</span></td>
                          <td>{row.federal?.ii?.rate == null ? "A validar" : pct(row.federal.ii.rate)}</td>
                          <td>{row.federal?.ipi?.rate == null ? "A validar" : pct(row.federal.ipi.rate)}</td>
                          <td>{statusLabel[row.status as Status] || row.status}</td>
                          <td>{row.commercial?.breakEvenPricePerUnitBrl == null ? "-" : money(row.commercial.breakEvenPricePerUnitBrl)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
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
                    <div>
                      {renderAttentionPoint(point)}
                      {(() => {
                        const issue = result.issues?.find((candidate: any) => candidate.message === point);
                        const itemId = issue?.itemId;
                        if (!itemId) return null;
                        const lower = point.toLowerCase();
                        const action = issue.code?.includes("defense") ? "exporter"
                          : lower.includes("tipi") || lower.includes("ipi") && lower.includes("ex") ? "ipi"
                          : lower.includes("mercosul") ? "mercosur_eu"
                          : lower.includes("ii") && (lower.includes("ex") || lower.includes("quota")) ? "ii"
                          : null;
                        return action ? <button type="button" className="attentionResolveBtn" onClick={() => focusTreatment(itemId, action)}>Resolver esta pendência</button> : null;
                      })()}
                    </div>
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
            {result.legalTrace?.length > 0 && (
              <ul className="legalTraceList">
                {result.legalTrace.map((entry: any, index: number) => <li key={index}>{entry.itemId ? `${entry.itemId} · ` : ""}{entry.tax ? `${entry.tax} · ` : ""}{entry.status || ""}{entry.legalBasis ? ` · ${entry.legalBasis}` : ""}</li>)}
              </ul>
            )}
          </details>

          {saveMessage && (
            <div className={saveMessage.startsWith("Simulação salva") ? "saveSuccess" : "saveError"} role="status">
              <div>
                <strong>{saveMessage.startsWith("Simulação salva") ? "Simulação salva." : "Não foi possível salvar esta simulação."}</strong>
                <span>{saveMessage}</span>
              </div>
              {saveMessage.includes("limite") && <a href="/upgrade">Conhecer o PRO</a>}
            </div>
          )}

          <div className="resultActions">
            <button className="primary" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : status === "calculated" || status === "alert" ? "Salvar no histórico" : "Salvar pré-estudo"}
            </button>
            <button className="secondaryBtn" onClick={downloadPdf} disabled={pdfGenerating || !(status === "calculated" || status === "alert")} title={status === "calculated" || status === "alert" ? "Gerar relatório executivo em PDF" : "Resolva as pendências antes de gerar o PDF executivo"}>{pdfGenerating ? "Gerando PDF..." : status === "calculated" || status === "alert" ? "Baixar PDF personalizado" : "PDF disponível após concluir"}</button>
          </div>
        </section>
      )}

      </div>
      <MobileBottomNav active="simulate" />
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

function NumericInput({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const format = (next: number) => String(Number(next.toFixed(6))).replace(".", ",");
  const [draft, setDraft] = useState(() => format(value));
  const editingRef = useRef(false);
  const valueRef = useRef(value);
  const delayRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    valueRef.current = value;
    if (!editingRef.current) setDraft(format(value));
  }, [value]);

  function clamp(next: number) {
    let result = Math.max(min, next);
    if (max != null) result = Math.min(max, result);
    return Number(result.toFixed(6));
  }

  function commit(next: number) {
    const safe = clamp(next);
    valueRef.current = safe;
    setDraft(format(safe));
    onChange(safe);
  }

  function changeBy(direction: -1 | 1) {
    commit(valueRef.current + direction * step);
  }

  function stopRepeat() {
    if (delayRef.current != null) window.clearTimeout(delayRef.current);
    if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    delayRef.current = null;
    intervalRef.current = null;
  }

  useEffect(() => stopRepeat, []);

  function startRepeat(direction: -1 | 1) {
    stopRepeat();
    changeBy(direction);
    delayRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => changeBy(direction), 75);
    }, 360);
  }

  return (
    <div className="numericControl">
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onFocus={() => { editingRef.current = true; }}
        onBlur={() => {
          editingRef.current = false;
          const parsed = Number(draft.replace(",", "."));
          if (Number.isFinite(parsed)) commit(parsed);
          else setDraft(format(valueRef.current));
        }}
        onChange={(e) => {
          const nextDraft = e.target.value;
          if (!/^\d*(?:[.,]\d*)?$/.test(nextDraft)) return;
          setDraft(nextDraft);
          const parsed = Number(nextDraft.replace(",", "."));
          if (nextDraft !== "" && Number.isFinite(parsed)) {
            const safe = clamp(parsed);
            valueRef.current = safe;
            onChange(safe);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            changeBy(1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            changeBy(-1);
          }
        }}
      />
      <button
        type="button"
        className="numericStep"
        aria-label={`Diminuir em ${format(step)}`}
        title={`Diminuir em ${format(step)} · mantenha pressionado para repetir`}
        disabled={value <= min}
        onPointerDown={(e) => { e.preventDefault(); startRepeat(-1); }}
        onPointerUp={stopRepeat}
        onPointerCancel={stopRepeat}
        onPointerLeave={stopRepeat}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            changeBy(-1);
          }
        }}
      >−</button>
      <button
        type="button"
        className="numericStep"
        aria-label={`Aumentar em ${format(step)}`}
        title={`Aumentar em ${format(step)} · mantenha pressionado para repetir`}
        disabled={max != null && value >= max}
        onPointerDown={(e) => { e.preventDefault(); startRepeat(1); }}
        onPointerUp={stopRepeat}
        onPointerCancel={stopRepeat}
        onPointerLeave={stopRepeat}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            changeBy(1);
          }
        }}
      >+</button>
    </div>
  );
}

function Num({
  label,
  hint,
  value,
  set,
  invalidate,
  step = 1,
  max,
}: {
  label: string;
  hint?: string;
  value: number;
  set: (value: number) => void;
  invalidate: () => void;
  step?: number;
  max?: number;
}) {
  return <Field label={label} hint={hint}><NumericInput value={value} min={0} max={max} step={step} onChange={(next) => { set(next); invalidate(); }} /></Field>;
}

function Text({ label, hint, value, set }: { label: string; hint?: string; value: string; set: (value: string) => void }) {
  return <Field label={label} hint={hint}><input value={value} onChange={(e) => set(e.target.value)} /></Field>;
}

function ItemNum({
  label,
  hint,
  value,
  set,
  step = 1,
  max,
}: {
  label: string;
  hint?: string;
  value: number;
  set: (value: number) => void;
  step?: number;
  max?: number;
}) {
  return <Field label={label} hint={hint}><NumericInput value={value} min={0} max={max} step={step} onChange={set} /></Field>;
}

function Check({ label, checked, set }: { label: string; checked: boolean; set: (value: boolean) => void }) {
  return <label><input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} />{label}</label>;
}
