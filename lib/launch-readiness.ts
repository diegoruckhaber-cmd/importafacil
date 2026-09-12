export const LAUNCH_READINESS_CONTRACT = "importafacil-launch-readiness-v1" as const;

export type LaunchReadinessStatus = "verified" | "in_progress" | "pending";
export type LaunchPriority = "P0" | "P1" | "P2";

export type LaunchReadinessItem = {
  id: string;
  priority: LaunchPriority;
  title: string;
  status: LaunchReadinessStatus;
  evidence: readonly string[];
  note: string;
};

export const LAUNCH_READINESS_ITEMS: readonly LaunchReadinessItem[] = [
  {
    id: "p0-defense-commercial-p0",
    priority: "P0",
    title: "Defesa comercial P0: tipos de medida, escopo, suspensões, compromisso de preço e ambiguidades",
    status: "verified",
    evidence: ["scripts/test-defense-commercial-p0-launch.mjs", "lib/defesa-comercial-resolver.ts"],
    note: "Cobertura P0 auditada permanece fail-closed quando escopo, vigência ou produtor/exportador não podem ser resolvidos.",
  },
  {
    id: "p0-state-scope",
    priority: "P0",
    title: "Escopo estadual explicitamente homologado e bloqueio fora do escopo",
    status: "verified",
    evidence: ["scripts/test-state-jurisdiction-scope.mjs", "lib/state-jurisdiction-registry.ts", "lib/state-activation-guard.ts"],
    note: "SC é a única UF ativa; as demais UFs não recebem fallback de regras catarinenses.",
  },
  {
    id: "p0-e2e-independent",
    priority: "P0",
    title: "Homologação E2E representativa contra evidência independente",
    status: "verified",
    evidence: ["lib/independent-e2e-benchmarks.ts", "scripts/test-independent-e2e-benchmarks.mjs", "docs/stage17-independent-e2e-benchmarks.md"],
    note: "Registros aduaneiros reais, desembaraçados e externos ao ImportaFácil foram sanitizados e reconciliados com o motor dentro de tolerância centesimal; os dados externos não viram regra fiscal canônica.",
  },
  {
    id: "p0-quality-regression",
    priority: "P0",
    title: "Bateria completa de regressão verde no candidato",
    status: "verified",
    evidence: ["scripts/run-full-engine-audit.mjs", ".github/workflows/recovery-validation.yml"],
    note: "O merge é condicionado à bateria completa de auditoria/regressão.",
  },
  {
    id: "p0-production-build-deploy",
    priority: "P0",
    title: "Build de produção e deploy Vercel no mesmo conteúdo aprovado",
    status: "verified",
    evidence: ["package.json", ".github/workflows/recovery-validation.yml"],
    note: "As etapas recentes foram fechadas somente após build, preview, merge e produção READY.",
  },
  {
    id: "p1-status-semantics",
    priority: "P1",
    title: "Status de produto distinguem cálculo, alerta, validação, bloqueio e não suportado",
    status: "verified",
    evidence: ["docs/simulation-v2.md", "lib/simulation-v2.ts"],
    note: "Simulation V2 possui estados explícitos e não converte bloqueio em cálculo final.",
  },
  {
    id: "p1-legal-provenance",
    priority: "P1",
    title: "Fonte legal, vigência e motivo de bloqueio integram a resposta auditável",
    status: "verified",
    evidence: ["lib/simulation-v2.ts", "lib/legal-foundation-registry-2026.ts"],
    note: "A camada de produto projeta fundamentos e motivos sem recriar regras fiscais.",
  },
  {
    id: "p1-no-silent-defense-fallback",
    priority: "P1",
    title: "Sem fallback silencioso em defesa comercial",
    status: "verified",
    evidence: ["scripts/test-defense-commercial-p0-launch.mjs", "lib/defesa-comercial-resolver.ts"],
    note: "Ambiguidade, escopo e dados obrigatórios ausentes retornam requires_input.",
  },
  {
    id: "p1-versioned-catalogs",
    priority: "P1",
    title: "Catálogos e snapshots com fonte/data de auditoria",
    status: "verified",
    evidence: ["lib/federal-tariff-source-manifest-2026.ts", "lib/legal-foundation-registry-2026.ts"],
    note: "O resultado identifica a versão/snapshot federal ativo e as fontes jurídicas registradas.",
  },
  {
    id: "p1-legislative-governance",
    priority: "P1",
    title: "Atualização legislativa com revisão humana antes da publicação",
    status: "verified",
    evidence: ["docs/stage10-legislative-publication-governance.md", "docs/legislative-update-runbook.md"],
    note: "Coleta automática não possui autorização para publicar regra fiscal diretamente em main.",
  },
  {
    id: "p1-temporary-ii-regression",
    priority: "P1",
    title: "II temporário preserva taxa-base do snapshot e alerta separado",
    status: "verified",
    evidence: ["scripts/test-temporary-ii-alerts.mjs", "scripts/test-temporary-ii-resolver.mjs"],
    note: "Tratamento temporário não substitui silenciosamente a taxa-base homologada.",
  },
  {
    id: "p2-state-expansion",
    priority: "P2",
    title: "Homologação estadual nacional progressiva",
    status: "in_progress",
    evidence: ["docs/stage13-state-jurisdiction-registry.md", "docs/stage14-state-homologation-preflight.md", "docs/stage15-state-activation-guard.md"],
    note: "Infraestrutura de expansão segura concluída; conteúdo tributário permanece homologado apenas para SC.",
  },
  {
    id: "p2-legislative-triage",
    priority: "P2",
    title: "Coleta/triagem legislativa automatizada com revisão humana",
    status: "verified",
    evidence: ["docs/stage10-legislative-publication-governance.md"],
    note: "Automação pode coletar e validar candidatos, mas não publicar regra fiscal autonomamente.",
  },
  {
    id: "p2-observability",
    priority: "P2",
    title: "Observabilidade e alertas de erro/divergência em produção",
    status: "verified",
    evidence: ["docs/stage11-production-observability.md", "app/api/health/route.ts"],
    note: "Telemetria é estruturada e deliberadamente não carrega dados fiscais/comerciais sensíveis da simulação.",
  },
  {
    id: "p2-rule-history",
    priority: "P2",
    title: "Histórico/versionamento de regras consultável",
    status: "verified",
    evidence: ["docs/stage12-rule-history-interface.md", "lib/rule-history.ts"],
    note: "A consulta é somente leitura e deriva dos registros canônicos existentes.",
  },
];

export function getLaunchReadiness() {
  const p0 = LAUNCH_READINESS_ITEMS.filter((item) => item.priority === "P0");
  const blockingP0 = p0.filter((item) => item.status !== "verified");
  const verified = LAUNCH_READINESS_ITEMS.filter((item) => item.status === "verified").length;

  return {
    contract: LAUNCH_READINESS_CONTRACT,
    policy: "evidence_based_fail_closed" as const,
    summary: {
      totalItems: LAUNCH_READINESS_ITEMS.length,
      verified,
      inProgress: LAUNCH_READINESS_ITEMS.filter((item) => item.status === "in_progress").length,
      pending: LAUNCH_READINESS_ITEMS.filter((item) => item.status === "pending").length,
      p0BlockingIds: blockingP0.map((item) => item.id),
    },
    release: {
      controlledBeta: blockingP0.length === 0 ? "eligible_for_release_review" as const : "blocked" as const,
      unrestrictedCommercial: blockingP0.length === 0 ? "eligible_for_release_review" as const : "blocked" as const,
      activeStateScope: ["SC"] as const,
    },
    items: LAUNCH_READINESS_ITEMS,
  };
}
