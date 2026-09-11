import { SC_IMPORT_SPECIAL_REGIMES_2026 } from "./sc-import-special-regimes.ts";

export type SCTtdSelection = 409 | 410 | 77 | "409/410" | "409+77";

export type SCItemDecisionInput = {
  id: string;
  ttd?: SCTtdSelection;
  destination?: "commercial_resale" | "industrialization";
  importEntryInSC?: boolean;
  validConcession?: boolean;
  concessiveActValid?: boolean;
  decree2128Prohibited?: boolean;
  blockedDescriptionMatches?: boolean;
  operation?: "fractionation" | "same_holder_interstate_transfer" | string;
  sameNcmPosition?: boolean;
  sameNcmPositionAfterFractionation?: boolean;
  characteristicsChanged?: boolean;
  otherOutputDeferment?: boolean;
  art246Paragraph23Or24?: boolean;
  taxableEventElection?: boolean;
  origin?: string;
  customsClearanceInSC?: boolean;
  roadEntryOtherUF?: boolean;
  mercosurRelevantImportShare?: number;
  notExcludedCatalogItem?: boolean;
  hasSpecificBaseReduction?: boolean;
  items?: Array<{ id: string; destination?: "commercial_resale" | "industrialization" }>;
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
    if (current && typeof current === "object" && key in current) return (current as Record<string, unknown>)[key];
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
  if (unknown.length) return { itemId: input.id, decision: "deny", benefit: null, reasons: ["Foi informado um regime especial de SC que não existe no catálogo jurídico vigente do sistema."], blockingIssues: ["unknown_special_regime", ...unknown], ruleIds: input.specialRegimeIds };

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
  if (mismatches.length) return { itemId: input.id, decision: "deny", benefit: null, reasons: ["As condições informadas não são compatíveis com o regime especial selecionado.", ...reasons], blockingIssues: [...new Set(mismatches.map((field) => `condition_mismatch:${field}`))], ruleIds: input.specialRegimeIds };
  if (missing.length || requiresLookup) return { itemId: input.id, decision: "conditional", benefit: (selected as NonNullable<typeof selected[number]>[]).map((rule) => rule.title).join(" + "), reasons: ["O regime especial foi identificado, mas a aplicação definitiva depende da comprovação das condições e/ou consulta específica.", ...reasons], blockingIssues: [...new Set(missing.map((field) => `condition_required:${field}`)), ...(requiresLookup ? ["special_regime_requires_lookup"] : [])], ruleIds: input.specialRegimeIds };
  return { itemId: input.id, decision: "apply", benefit: (selected as NonNullable<typeof selected[number]>[]).map((rule) => rule.title).join(" + "), reasons, blockingIssues: [], ruleIds: input.specialRegimeIds };
}

const normalizedSameNcm = (input: SCItemDecisionInput) => input.sameNcmPositionAfterFractionation ?? input.sameNcmPosition;
const concessionIsInvalid = (input: SCItemDecisionInput) => input.validConcession === false || input.concessiveActValid === false;

/** Conservative SC eligibility layer. No rate or tax amount is created here. */
export function decideSCItem(input: SCItemDecisionInput): SCDecision {
  const specialDecision = resolveSelectedSpecialRegimes(input);
  if (specialDecision) return specialDecision;

  if (input.decree2128Prohibited === true) return { itemId: input.id, decision: "deny", benefit: null, reasons: ["Mercadoria informada como abrangida pela vedação do Decreto 2.128/2009."], blockingIssues: ["decreto_2128_prohibition"] };
  if (input.blockedDescriptionMatches === false) return { itemId: input.id, decision: "conditional", benefit: input.ttd ? `TTD ${input.ttd}` : null, reasons: ["A coincidência de NCM, sem correspondência com a descrição legal da vedação, não é suficiente para bloquear automaticamente o benefício."], blockingIssues: ["decree_2128_legal_description_review"] };
  if (input.ttd !== undefined && concessionIsInvalid(input)) return { itemId: input.id, decision: "deny", benefit: null, reasons: ["O TTD informado não possui ato concessivo válido comprovado."], blockingIssues: ["valid_concession_required"] };

  if (Number.isFinite(input.mercosurRelevantImportShare)) {
    const share = Number(input.mercosurRelevantImportShare);
    if (share < 50) return { itemId: input.id, decision: "deny", benefit: null, reasons: ["O percentual acumulado informado para a condição do art. 110-B está abaixo de 50%."], blockingIssues: ["mercosur_art110b_threshold_not_met"] };
    return { itemId: input.id, decision: "conditional", benefit: input.ttd ? `TTD ${input.ttd}` : null, reasons: ["O percentual mínimo de 50% foi atingido, mas as demais condições e exclusões do art. 110-B ainda precisam ser comprovadas."], blockingIssues: ["mercosur_art110b_remaining_conditions"] };
  }

  if (String(input.origin ?? "").toLowerCase() === "paraguay" && input.customsClearanceInSC === false && input.roadEntryOtherUF === true) {
    return { itemId: input.id, decision: "conditional", benefit: input.ttd ? `TTD ${input.ttd}` : null, reasons: ["A configuração rodoviária de origem paraguaia pode ser admitida no entendimento catalogado, mas depende das condições do regime e do art. 110-B aplicáveis ao período."], blockingIssues: ["paraguay_road_entry_conditions"] };
  }

  if (input.hasSpecificBaseReduction === true) return { itemId: input.id, decision: "conditional", benefit: input.ttd ? `TTD ${input.ttd}` : null, reasons: ["Existe redução específica de base de cálculo; a compatibilidade entre benefícios deve ser resolvida antes de qualquer cumulação econômica."], blockingIssues: ["benefit_compatibility_required"] };

  if (input.operation === "same_holder_interstate_transfer") {
    if (input.taxableEventElection === false) return { itemId: input.id, decision: "deny", benefit: null, reasons: ["A transferência interestadual ao mesmo titular sem a eleição exigida não pode receber automaticamente o crédito presumido."], blockingIssues: ["taxable_event_election_required"] };
    return { itemId: input.id, decision: "conditional", benefit: input.ttd ? `TTD ${input.ttd}` : null, reasons: ["A transferência entre estabelecimentos do mesmo titular exige validação da modalidade jurídica, da eventual eleição tributária e das demais condições do TTD."], blockingIssues: ["same_holder_transfer_conditions"] };
  }

  if (input.ttd === "409+77") {
    const destinations = new Set((input.items ?? []).map((item) => item.destination));
    return { itemId: input.id, decision: "conditional", benefit: "TTD 409 + TTD 77", reasons: ["Operação mista deve ser decidida por item e por destinação; não é permitido aplicar um único tratamento à declaração inteira."], blockingIssues: destinations.size > 1 ? ["mixed_item_destinations"] : ["ttd409_ttd77_item_level_validation"] };
  }

  if (input.ttd === "409/410") {
    if (input.operation === "fractionation") {
      const sameNcm = normalizedSameNcm(input);
      if (sameNcm === false) return { itemId: input.id, decision: "deny", benefit: null, reasons: ["O fracionamento alterou a posição da NCM; o crédito presumido não deve ser aplicado automaticamente ao produto resultante."], blockingIssues: ["ncm_position_changed"] };
      if (sameNcm === true) return { itemId: input.id, decision: "apply", benefit: "TTD 409/410", reasons: ["O fracionamento mantém a posição NCM; esse fato, isoladamente, não impede a elegibilidade, sujeita às demais condições do regime."], blockingIssues: [] };
    }
    return { itemId: input.id, decision: "conditional", benefit: "TTD 409/410", reasons: ["O tratamento combinado 409/410 depende dos fatos operacionais específicos informados."], blockingIssues: ["ttd409410_context_required"] };
  }

  if (input.ttd === undefined) return { itemId: input.id, decision: "conditional", benefit: null, reasons: ["Nenhum regime especial foi selecionado; a operação deve seguir a tributação normal ou outra regra aplicável."], blockingIssues: [] };

  if (input.ttd === 409 || input.ttd === 410) {
    if (input.importEntryInSC === false) return { itemId: input.id, decision: "conditional", benefit: null, reasons: ["A entrada/importação não foi caracterizada como elegível em SC."], blockingIssues: ["import_entry_location"] };
    if (input.destination === undefined) return { itemId: input.id, decision: "conditional", benefit: `TTD ${input.ttd}`, reasons: ["A destinação posterior da mercadoria é necessária para determinar o tratamento subsequente."], blockingIssues: ["destination_required"] };
    if (input.ttd === 410 && input.destination === "industrialization") return { itemId: input.id, decision: "conditional", benefit: "TTD 410 — importação", reasons: ["A etapa de importação e a saída posterior para industrialização devem ser tratadas separadamente."], blockingIssues: ["industrial_output_treatment_required"] };
    if (input.otherOutputDeferment === true && input.art246Paragraph23Or24 !== true) return { itemId: input.id, decision: "conditional", benefit: `TTD ${input.ttd} — importação`, reasons: ["A saída já possui outro diferimento e a compatibilidade com o crédito presumido precisa ser determinada."], blockingIssues: ["output_deferment_compatibility"] };
    const sameNcm = normalizedSameNcm(input);
    if (sameNcm === false) return { itemId: input.id, decision: "deny", benefit: null, reasons: ["O fracionamento informado alterou a posição da NCM; o crédito presumido não deve ser aplicado automaticamente ao produto resultante."], blockingIssues: ["ncm_position_changed"] };
    return { itemId: input.id, decision: "apply", benefit: `TTD ${input.ttd}`, reasons: [`TTD ${input.ttd} elegível para a etapa de importação, condicionado às demais regras do ato concessivo.`, "O tratamento da saída subsequente será calculado separadamente conforme a destinação."], blockingIssues: [] };
  }

  if (input.ttd === 77) return { itemId: input.id, decision: "conditional", benefit: "TTD 77", reasons: ["O TTD 77 exige avaliação específica das condições e da destinação da operação."], blockingIssues: ["ttd77_specific_conditions"] };
  return { itemId: input.id, decision: "conditional", benefit: null, reasons: ["Regra de SC não determinada com segurança suficiente."], blockingIssues: ["unresolved_sc_rule"] };
}

export function decideSCMultiItem(items: SCItemDecisionInput[]): SCDecision[] { return items.map(decideSCItem); }
