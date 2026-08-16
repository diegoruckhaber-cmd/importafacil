import type { ImportScenarioResult } from "./import-scenario-comparator.ts";

export type ImportScenarioRecommendation = {
  status: "recommended" | "no_eligible_benefit" | "conditional_only";
  recommendedScenario: ImportScenarioResult["scenario"] | null;
  headline: string;
  rationale: string[];
  rejectedScenarios: Array<{
    scenario: ImportScenarioResult["scenario"];
    reason: string;
  }>;
};

/**
 * Chooses only among scenarios already validated by the legal/benefit engines.
 * Economics ranks the legally applicable results; it never makes a conditional
 * or denied treatment applicable merely because it is cheaper.
 */
export function recommendImportScenario(results: ImportScenarioResult[]): ImportScenarioRecommendation {
  const normal = results.find((result) => result.scenario === "normal");
  const applicable = results.filter((result) => result.scenario !== "normal" && result.decision === "apply" && result.legallyEligible);
  const conditional = results.filter((result) => result.scenario !== "normal" && result.decision === "conditional");

  if (applicable.length > 0) {
    const recommended = [...applicable].sort((a, b) => a.landedCostAfterBenefit - b.landedCostAfterBenefit)[0];
    const rejectedScenarios = results
      .filter((result) => result.scenario !== recommended.scenario)
      .map((result) => ({
        scenario: result.scenario,
        reason: result.decision === "apply"
          ? `Aplicável, porém o custo líquido é maior em ${formatBrl(result.landedCostAfterBenefit - recommended.landedCostAfterBenefit)}.`
          : result.legalReasons[0] ?? "Tratamento não aplicável nas condições informadas.",
      }));
    return {
      status: "recommended",
      recommendedScenario: recommended.scenario,
      headline: `${recommended.label} é o cenário mais eficiente entre os tratamentos juridicamente aplicáveis.`,
      rationale: [
        "A recomendação considera somente benefícios cuja decisão jurídica foi 'apply'.",
        `Custo líquido do cenário recomendado: ${formatBrl(recommended.landedCostAfterBenefit)}.`,
        `Economia de ICMS na importação: ${formatBrl(recommended.importICMSSavings)}.`,
      ],
      rejectedScenarios,
    };
  }

  if (conditional.length > 0) {
    return {
      status: "conditional_only",
      recommendedScenario: normal?.scenario ?? null,
      headline: "Há tratamentos potencialmente vantajosos, mas nenhuma condição foi validada o suficiente para recomendar sua aplicação.",
      rationale: [
        "O sistema não transforma uma hipótese ou condição pendente em benefício econômico.",
        ...conditional.map((result) => `${result.label}: ${result.legalReasons[0] ?? "condições pendentes"}`),
      ],
      rejectedScenarios: results.filter((result) => result.scenario !== "normal").map((result) => ({ scenario: result.scenario, reason: result.legalReasons[0] ?? "Condições pendentes." })),
    };
  }

  return {
    status: "no_eligible_benefit",
    recommendedScenario: normal?.scenario ?? null,
    headline: "Nenhum benefício estadual foi validado para as condições informadas; mantenha o regime normal.",
    rationale: ["A tributação normal permanece como referência quando nenhum tratamento beneficiado é juridicamente aplicável."],
    rejectedScenarios: results.filter((result) => result.scenario !== "normal").map((result) => ({ scenario: result.scenario, reason: result.legalReasons[0] ?? "Tratamento não aplicável." })),
  };
}

function formatBrl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
