"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  buildDashboardInsights,
  filterDashboardRecords,
  type DashboardStatusFilter,
} from "../../lib/dashboard-insights";
import {
  savedSimulationKind,
  savedSimulationStatus,
  savedSimulationTotal,
  type SavedSimulationRecord,
} from "../../lib/simulation-record";
import { supabase } from "../../lib/supabase";

const br = (n: number) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const kindLabel = { v2: "Simulation V2", sc: "Operação SC", legacy: "Legado" };
const statusLabel: Record<string, string> = {
  calculated: "Calculado",
  alert: "Com alerta",
  requires_input: "Requer validação",
  blocked: "Bloqueado",
  unsupported: "Não suportado",
};
const statusFilters: Array<{ value: DashboardStatusFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "calculated", label: "Calculados" },
  { value: "alert", label: "Alertas" },
  { value: "requires_input", label: "Requer validação" },
  { value: "blocked", label: "Bloqueados" },
  { value: "unsupported", label: "Não suportados" },
];

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("FREE");
  const [subscriptionStatus, setSubscriptionStatus] = useState("none");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [items, setItems] = useState<SavedSimulationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DashboardStatusFilter>("all");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || !session?.access_token) {
        location.href = "/auth";
        return;
      }
      setEmail(user.email || "");

      const [subscriptionResponse, simulationsResponse] = await Promise.all([
        fetch("/api/subscription", {
          headers: { Authorization: "Bearer " + session.access_token },
          cache: "no-store",
        }),
        supabase
          .from("simulations")
          .select("id,name,input,result,created_at,server_execution")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(100),
      ]);

      if (subscriptionResponse.ok) {
        const subscription = await subscriptionResponse.json();
        setPlan(String(subscription.plan || "FREE").toUpperCase());
        setSubscriptionStatus(String(subscription.status || "none"));
        setCurrentPeriodEnd(subscription.currentPeriodEnd || null);
      } else {
        const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
        if (profile?.plan) setPlan(profile.plan);
      }

      setItems((simulationsResponse.data || []) as SavedSimulationRecord[]);
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "success") {
        setNotice("Retorno do checkout recebido. O acesso PRO depende da confirmação do pagamento pela Stripe.");
      }
      if (params.get("checkout") === "cancelled") {
        setNotice("Checkout cancelado. Nenhuma alteração foi feita na sua conta.");
      }
      setLoading(false);
    })();
  }, []);

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  async function loadMore() {
    setLoadingMore(true);
    try {
      const { data, error } = await supabase.from("simulations").select("id,name,input,result,created_at,server_execution")
        .order("created_at", { ascending: false }).order("id", { ascending: false }).range(items.length, items.length + 99);
      if (error) throw error;
      setItems(current => [...current, ...(data || [])].filter((x, i, all) => all.findIndex(y => y.id === x.id) === i));
      setHasMore((data || []).length === 100);
    } catch { setNotice("Não foi possível carregar mais simulações. Tente novamente."); }
    finally { setLoadingMore(false); }
  }

  async function logout() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  const isFree = plan.toUpperCase() === "FREE";
  const planVisible = isFree ? items.slice(0, 3) : items;
  const insights = useMemo(() => buildDashboardInsights(planVisible), [planVisible]);
  const shown = useMemo(
    () => filterDashboardRecords(planVisible, { query, status: statusFilter }),
    [planVisible, query, statusFilter],
  );
  const periodLabel = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString("pt-BR") : null;
  const accountLabel = email + " · " + plan + (!isFree && subscriptionStatus ? " · " + subscriptionStatus : "");
  const historyText = isFree
    ? "Seu plano gratuito inclui até 3 simulações salvas."
    : "Histórico completo das suas simulações." + (periodLabel ? " Período atual até " + periodLabel + "." : "");

  return (
    <main style={{ minHeight: "100vh", background: "#f7f7f4" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e7e7e2" }}>
        <div style={{ maxWidth: 1180, margin: "auto", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <a href="/" style={{ fontWeight: 900, color: "#111", textDecoration: "none" }}>ImportaFácil</a>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#666" }}>{accountLabel}</span>
            <button onClick={logout} style={{ border: 0, background: "transparent", cursor: "pointer" }}>Sair</button>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: "auto", padding: "46px 24px 70px" }}>
        {notice && <div style={noticeStyle}>{notice}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <small style={{ letterSpacing: 1, color: "#777" }}>MINHA CONTA</small>
            <h1 style={{ fontSize: 42, margin: "8px 0" }}>Painel de simulações</h1>
            <p style={{ color: "#666", marginBottom: 0 }}>{historyText}</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {!isFree && <a href="/comparar" style={secondary}>Comparar V2</a>}
            {!isFree && insights.latestV2Id && <a href={"/relatorio?id=" + insights.latestV2Id} style={secondary}>Relatório mais recente</a>}
            {isFree && <a href="/upgrade" style={primary}>Assinar PRO</a>}
            {!isFree && <a href="/upgrade" style={secondary}>Minha assinatura</a>}
            <a href="/feedback?from=/dashboard" style={secondary}>Enviar feedback</a>
            <a href="/simulacao-v2" style={primary}>Nova Simulation V2</a>
          </div>
        </div>

        {!loading && (
          <div style={metricGrid}>
            <Metric label="Simulações visíveis" value={String(insights.totalSaved)} detail={isFree ? "limite FREE: 3" : "simulações carregadas"} />
            <Metric label="Simulation V2" value={String(insights.v2Count)} detail="snapshots do motor canônico" />
            <Metric label="Pontos de atenção" value={String(insights.attentionCount)} detail="alerta, validação ou bloqueio" />
            <Metric label="Último custo salvo" value={insights.latestId ? br(insights.latestCostBrl) : "—"} detail="sem recalcular o snapshot" />
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e5e5df", borderRadius: 18, padding: 18, margin: "22px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) minmax(220px,320px)", gap: 12 }}>
            <label style={label}>
              Buscar nas simulações carregadas
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome, cenário ou UF"
                style={input}
              />
            </label>
            <label style={label}>
              Status V2
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as DashboardStatusFilter)} style={input}>
                {statusFilters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
              </select>
            </label>
          </div>
          <small style={{ display: "block", color: "#777", marginTop: 10 }}>
            Os filtros atuam apenas sobre os snapshots salvos. Nenhum tributo é recalculado no painel.
          </small>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : planVisible.length === 0 ? (
          <div style={empty}>
            <h2>Seu histórico está vazio.</h2>
            <p style={{ color: "#666" }}>Faça uma Simulation V2 e salve o resultado para começar.</p>
            <a href="/simulacao-v2" style={primary}>Criar primeira simulação</a>
          </div>
        ) : shown.length === 0 ? (
          <div style={empty}>
            <h2>Nenhuma simulação corresponde aos filtros.</h2>
            <p style={{ color: "#666" }}>Ajuste a busca ou selecione outro status.</p>
            <button onClick={() => { setQuery(""); setStatusFilter("all"); }} style={secondaryButton}>Limpar filtros</button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {shown.map((record) => {
              const kind = savedSimulationKind(record);
              const status = savedSimulationStatus(record);
              const destinationUf = String(record.input?.destinationUf || record.result?.operation?.destinationUf || "").toUpperCase();
              return (
                <article key={record.id} style={row}>
                  <a href={"/simulacao/" + record.id} style={{ textDecoration: "none", color: "inherit", flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <b>{record.name || "Simulação de importação"}</b>
                      <span style={pill}>{kindLabel[kind]}</span>
                      {kind === "v2" && <span style={statusPill(status)}>{statusLabel[status] || status}</span>}
                      {destinationUf && <span style={pill}>UF {destinationUf}</span>}
                    </div>
                    <small style={{ display: "block", color: "#888", marginTop: 6 }}>{new Date(record.created_at).toLocaleString("pt-BR")}</small>
                    <small style={{ display: "block", color: "#3657d6", marginTop: 9, fontWeight: 800 }}>Abrir snapshot →</small>
                  </a>
                  <div style={{ textAlign: "right", minWidth: 170 }}>
                    <small style={{ color: "#888" }}>Custo nacionalizado</small>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>{br(savedSimulationTotal(record))}</div>
                    {!isFree && kind === "v2" && (
                      <a href={"/relatorio?id=" + record.id} style={{ fontSize: 12, color: "#555", fontWeight: 700 }}>Relatório</a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {isFree && items.length >= 3 && (
          <div style={{ marginTop: 18, padding: 18, borderRadius: 14, background: "#fff7df", border: "1px solid #ead9a3" }}>
            Você atingiu o limite de 3 simulações salvas no plano FREE. <a href="/upgrade" style={{ fontWeight: 800, color: "#111" }}>Assinar PRO</a> libera o histórico completo, comparação e relatórios.
          </div>
        )}
        {!isFree && hasMore && <button disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Carregando..." : "Carregar mais simulações"}</button>}
      </section>
    </main>
  );
}

function Metric({ label: metricLabel, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div style={metric}>
      <small style={{ color: "#777" }}>{metricLabel}</small>
      <div style={{ fontSize: 25, fontWeight: 900, margin: "6px 0" }}>{value}</div>
      <small style={{ color: "#888" }}>{detail}</small>
    </div>
  );
}

function statusPill(status: string): CSSProperties {
  const warning = ["alert", "requires_input"].includes(status);
  const blocked = ["blocked", "unsupported"].includes(status);
  return {
    ...pill,
    background: blocked ? "#fff0f0" : warning ? "#fff6df" : "#eef8f0",
    color: blocked ? "#a61b1b" : warning ? "#8b5a00" : "#176c43",
  };
}

const primary: CSSProperties = { padding: "12px 16px", background: "#111", color: "white", borderRadius: 10, textDecoration: "none", fontWeight: 800, display: "inline-block" };
const secondary: CSSProperties = { padding: "11px 15px", border: "1px solid #111", color: "#111", borderRadius: 10, textDecoration: "none", fontWeight: 700, display: "inline-block" };
const secondaryButton: CSSProperties = { ...secondary, background: "white", cursor: "pointer" };
const empty: CSSProperties = { background: "white", border: "1px solid #e5e5df", borderRadius: 18, padding: 40 };
const row: CSSProperties = { background: "white", border: "1px solid #e5e5df", borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center", flexWrap: "wrap" };
const pill: CSSProperties = { fontSize: 11, padding: "4px 7px", background: "#f0f0ec", borderRadius: 999, color: "#555", fontWeight: 700 };
const metricGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 };
const metric: CSSProperties = { background: "white", border: "1px solid #e5e5df", borderRadius: 16, padding: 18 };
const noticeStyle: CSSProperties = { marginBottom: 20, padding: 14, borderRadius: 12, background: "#eef6ff", border: "1px solid #cfe3ff", color: "#174a7e" };
const label: CSSProperties = { display: "grid", gap: 7, fontSize: 13, fontWeight: 700, color: "#555" };
const input: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 12px", border: "1px solid #d8d8d2", borderRadius: 10, background: "white", fontSize: 14 };
