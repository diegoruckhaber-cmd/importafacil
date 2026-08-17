import { SC_IMPORT_SPECIAL_REGIMES_2026 } from "./sc-import-special-regimes.ts";

export type SCItemDecisionInput = {
  id: string;
  ttd?: 409 | 410 | 77;
  destination?: "commercial_resale" | "industrialization";
  importEntryInSC?: boolean;
  validConcession?: boolean;
  decree2128Prohibited?: boolean;
  sameNcmPositionAfterFractionation?: boolean;
  otherOutputDeferment?: boolean;
  art246Paragraph23Or24?: boolean;
  taxableEventElection?: boolean;
  specialRegimeIds?: string[];
  specialRegimeContext?: Record<string, unknown>;
};

export type SCDecision = {
  itemId: string;
  decision: "apply" | "deny" | "conditional";
  benefit: string | null;
  reasons: string[];
  blockingIssues: string[];
  ruleIds?: string[];
};

function getPathValue(context: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, context);
}

function conditionMatches(context: Record<string, unknown>, condition: { field: string; operator: string; value?: unknown }): "match" | "mismatch" | "missing" {
  const actual = getPathValue(context, condition.field);
  if (actual === undefined || actual === null) return "missing";
  if (condition.operator === "eq") return actual === condition.value ? "match" : "mismatch";
  if (condition.operator === "in") return Array.isArray(condition.value) && condition.value.includes(actual) ? "match" : "mismatch";
  return "missing";
}

function resolveSelectedSpecialRegimes(input: SCItemDecisionInput): SCDecision | null {
  if (!input.specialRegimeIds?.length) return null;

  const selected = input.specialRegimeIds.map((id) => SC_IMPORT_SPECIAL_REGIMES_2026.find((rule) => rule.id === id));
  const unknown = input.specialRegimeIds.filter((_, index) => !selected[index]);
  if (unknown.length) {
    return {
      itemId: input.id,
      decision: "deny",
      benefit: null,
      reasons: ["Foi informado um regime especial de SC que não existe no catálogo jurídico vigente do sistema."],
      blockingIssues: ["unknown_special_regime", ...unknown],
      ruleIds: input.specialRegimeIds,
    };
  }

  const context = input.specialRegimeContext ?? {};
  const missing: string[] = [];
  const mismatches: string[] = [];
  const reasons: string[] = [];
  let requiresLookup = false;

  for (const rule of selected as NonNullable<typeof selected[number]>[]) {
    if (rule.status === "requires_lookup") requiresLookup = true;
    for (const condition of rule.conditions) {
      const result = conditionMatches(context, condition);
      if (result === "missing") missing.push(condition.field);
      if (result === "mismatch") mismatches.push(condition.field);
    }
    reasons.push(`${rule.title} — fundamento: ${rule.legalBasis}.`);
    for (const note of rule.treatment.notes ?? []) reasons.push(note);
  }

  if (mismatches.length) {
    return {
      itemId: input.id,
      decision: "deny",
      benefit: null,
      reasons: ["As condições informadas não são compatíveis com o regime especial selecionado.", ...reasons],
      blockingIssues: [...new Set(mismatches.map((field) => `condition_mismatch:${field}`))],
      ruleIds: input.specialRegimeIds,
    };
  }

  if (missing.length || requiresLookup) {
    return {
      itemId: input.id,
      decision: "conditional",
      benefit: (selected as NonNullable<typeof selected[number]>[]).map((rule) => rule.title).join(" + "),
      reasons: ["O regime especial foi identificado, mas a aplicação definitiva depende da comprovação das condições e/ou consulta específica.", ...reasons],
      blockingIssues: [
        ...new Set(missing.map((field) => `condition_required:${field}`)),
        ...(requiresLookup ? ["special_regime_requires_lookup"] : []),
      ],
      ruleIds: input.specialRegimeIds,
    };
  }

  return {
    itemId: input.id,
    decision: "apply",
    benefit: (selected as NonNullable<typeof selected[number]>[]).map((rule) => rule.title).join(" + "),
    reasons,
    blockingIssues: [],
    ruleIds: input.specialRegimeIds,
  };
}

/**
 * Conservative SC eligibility layer. It never invents rates or tax amounts.
 * Special import regimes are resolved only when explicitly selected by rule ID.
 */
export function decideSCItem(input: SCItemDecisionInput): SCDecision {
  const specialDecision = resolveSelectedSpecialRegimes(input);
  if (specialDecision) return specialDecision;

  if (input.decree2128Prohibited === true) {
    return { itemId: input.id, decision: "deny", benefit: null, reasons: ["Mercadoria informada como abrangida pela vedação do Decreto 2.128/2009."], blockingIssues: ["decreto_2128_prohibition"] };
  }

  if (input.ttd !== undefined && input.validConcession === false) {
    return { itemId: input.id, decision: "deny", benefit: null, reasons: ["O TTD informado não possui ato concessivo válido comprovado."], blockingIssues: ["valid_concession_required"] };
  }

  if (input.ttd === undefined) {
    return { itemId: input.id, decision: "conditional", benefit: null, reasons: ["Nenhum regime especial foi selecionado; a operação deve seguir a tributação normal ou outra regra aplicável."], blockingIssues: [] };
  }

  if (input.ttd === 409 || input.ttd === 410) {
    if (input.importEntryInSC === false) return { itemId: input.id, decision: "conditional", benefit: null, reasons: ["A entrada/importação não foi caracterizada como elegível em SC."], blockingIssues: ["import_entry_location"] };
    if (input.destination === undefined) return { itemId: input.id, decision: "conditional", benefit: `TTD ${input.ttd}`, reasons: ["A destinação posterior da mercadoria é necessária para determinar o tratamento subsequente."], blockingIssues: ["destination_required"] };
    if (input.ttd === 410 && input.destination === "industrialization") return { itemId: input.id, decision: "conditional", benefit: "TTD 410 — importação", reasons: ["A etapa de importação e a saída posterior para industrialização devem ser tratadas separadamente."], blockingIssues: ["industrial_output_treatment_required"] };
    if (input.otherOutputDeferment === true && input.art246Paragraph23Or24 !== true) return { itemId: input.id, decision: "conditional", benefit: `TTD ${input.ttd} — importação`, reasons: ["A saída já possui outro diferimento e a compatibilidade com o crédito presumido precisa ser determinada."], blockingIssues: ["output_deferment_compatibility"] };
    if (input.sameNcmPositionAfterFractionation === false) return { itemId: input.id, decision: "deny", benefit: null, reasons: ["O fracionamento informado alterou a posição da NCM; o crédito presumido não deve ser aplicado automaticamente ao produto resultante."], blockingIssues: ["ncm_position_changed"] };
    return { itemId: input.id, decision: "apply", benefit: `TTD ${input.ttd}`, reasons: [`TTD ${input.ttd} elegível para a etapa de importação, condicionado às demais regras do ato concessivo.`, "O tratamento da saída subsequente será calculado separadamente conforme a destinação."], blockingIssues: [] };
  }

  if (input.ttd === 77) return { itemId: input.id, decision: "conditional", benefit: "TTD 77", reasons: ["O TTD 77 exige avaliação específica das condições e da destinação da operação."], blockingIssues: ["ttd77_specific_conditions"] };

  return { itemId: input.id, decision: "conditional", benefit: null, reasons: ["Regra de SC não determinada com segurança suficiente."], blockingIssues: ["unresolved_sc_rule"] };
}

export function decideSCMultiItem(items: SCItemDecisionInput[]): SCDecision[] {
  return items.map(decideSCItem);
}
