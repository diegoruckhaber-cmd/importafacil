import type { ImportScenarioResult } from "./import-scenario-comparator.ts";

export type ScenarioLegalMemory = {
  decision: ImportScenarioResult["decision"];
  statusLabel: "Aplicável" | "Condicional" | "Não aplicável" | "Normal";
  legalConclusion: string;
  legalReasons: string[];
  blockingIssues: string[];
  legalSource: string;
  economicConclusion: string;
  importStage: {
    normalRate: number;
    effectiveRate: number;
    savings: number;
  };
  outputStageNote: string;
};

export function buildScenarioLegalMemory(result: ImportScenarioResult): ScenarioLegalMemory {
  const statusLabel = result.decision === "apply"
    ? "Aplicável"
    : result.decision === "conditional"
      ? "Condicional"
      : result.decision === "deny"
        ? "Não aplicável"
        : "Normal";

  const legalConclusion = result.decision === "apply"
    ? "O tratamento foi validado pelo motor jurídico para as premissas informadas."
    : result.decision === "conditional"
      ? "O tratamento não deve ser considerado definitivamente aplicável enquanto as condições pendentes não forem comprovadas."
      : result.decision === "deny"
        ? "O tratamento foi bloqueado pelas regras/guardrails jurídicos aplicados à operação."
        : "A operação permanece no tratamento tributário normal, sem benefício estadual selecionado.";

  const economicConclusion = result.importICMSSavings > 0
    ? `Economia de ICMS na etapa de importação estimada em R$ ${result.importICMSSavings.toFixed(2)}.`
    : "Nenhuma economia de ICMS na etapa de importação foi reconhecida neste cenário.";

  const outputStageNote = result.benefitResolution?.outputPresumedCredit
    ? "A existência de crédito presumido/tratamento na saída subsequente é uma etapa distinta e não deve ser confundida com a alíquota efetiva do ICMS na importação."
    : "Este comparador não transforma o tratamento da saída subsequente em redução automática do ICMS devido na importação.";

  return {
    decision: result.decision,
    statusLabel,
    legalConclusion,
    legalReasons: result.legalReasons,
    blockingIssues: result.blockingIssues,
    legalSource: result.source,
    economicConclusion,
    importStage: {
      normalRate: result.engineResult.items[0]?.icmsNormalRate ?? 0,
      effectiveRate: result.engineResult.items[0]?.icmsImportEffectiveRate ?? 0,
      savings: result.importICMSSavings,
    },
    outputStageNote,
  };
}
