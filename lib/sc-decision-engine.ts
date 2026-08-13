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
};

export type SCDecision = {
  itemId: string;
  decision: "apply" | "deny" | "conditional";
  benefit: string | null;
  reasons: string[];
  blockingIssues: string[];
};

/**
 * Conservative SC eligibility layer.
 * It deliberately does not invent rates or tax amounts.
 * Missing evidence produces "conditional" rather than an inferred benefit.
 */
export function decideSCItem(input: SCItemDecisionInput): SCDecision {
  const reasons: string[] = [];
  const blockingIssues: string[] = [];

  if (input.decree2128Prohibited === true) {
    return {
      itemId: input.id,
      decision: "deny",
      benefit: null,
      reasons: ["Mercadoria informada como abrangida pela vedação do Decreto 2.128/2009."],
      blockingIssues: ["decreto_2128_prohibition"],
    };
  }

  if (input.ttd !== undefined && input.validConcession === false) {
    return {
      itemId: input.id,
      decision: "deny",
      benefit: null,
      reasons: ["O TTD informado não possui ato concessivo válido comprovado."],
      blockingIssues: ["valid_concession_required"],
    };
  }

  if (input.ttd === undefined) {
    return {
      itemId: input.id,
      decision: "conditional",
      benefit: null,
      reasons: ["Nenhum regime especial foi selecionado; a operação deve seguir a tributação normal ou outra regra aplicável."],
      blockingIssues: [],
    };
  }

  if (input.ttd === 409 || input.ttd === 410) {
    if (input.importEntryInSC === false) {
      return {
        itemId: input.id,
        decision: "conditional",
        benefit: null,
        reasons: ["A entrada/importação não foi caracterizada como elegível em SC."],
        blockingIssues: ["import_entry_location"],
      };
    }

    if (input.destination === undefined) {
      return {
        itemId: input.id,
        decision: "conditional",
        benefit: `TTD ${input.ttd}`,
        reasons: ["A destinação posterior da mercadoria é necessária para determinar o tratamento subsequente."],
        blockingIssues: ["destination_required"],
      };
    }

    if (input.ttd === 410 && input.destination === "industrialization") {
      reasons.push("A etapa de importação e a saída posterior para industrialização devem ser tratadas separadamente.");
      return {
        itemId: input.id,
        decision: "conditional",
        benefit: "TTD 410 — importação",
        reasons,
        blockingIssues: ["industrial_output_treatment_required"],
      };
    }

    if (input.otherOutputDeferment === true && input.art246Paragraph23Or24 !== true) {
      return {
        itemId: input.id,
        decision: "conditional",
        benefit: `TTD ${input.ttd} — importação`,
        reasons: ["A saída já possui outro diferimento e a compatibilidade com o crédito presumido precisa ser determinada."],
        blockingIssues: ["output_deferment_compatibility"],
      };
    }

    if (input.sameNcmPositionAfterFractionation === false) {
      return {
        itemId: input.id,
        decision: "deny",
        benefit: null,
        reasons: ["O fracionamento informado alterou a posição da NCM; o crédito presumido não deve ser aplicado automaticamente ao produto resultante."],
        blockingIssues: ["ncm_position_changed"],
      };
    }

    return {
      itemId: input.id,
      decision: "apply",
      benefit: `TTD ${input.ttd}`,
      reasons: [
        `TTD ${input.ttd} elegível para a etapa de importação, condicionado às demais regras do ato concessivo.`,
        "O tratamento da saída subsequente será calculado separadamente conforme a destinação.",
      ],
      blockingIssues: [],
    };
  }

  if (input.ttd === 77) {
    return {
      itemId: input.id,
      decision: "conditional",
      benefit: "TTD 77",
      reasons: ["O TTD 77 exige avaliação específica das condições e da destinação da operação."],
      blockingIssues: ["ttd77_specific_conditions"],
    };
  }

  return {
    itemId: input.id,
    decision: "conditional",
    benefit: null,
    reasons: ["Regra de SC não determinada com segurança suficiente."],
    blockingIssues: ["unresolved_sc_rule"],
  };
}

export function decideSCMultiItem(items: SCItemDecisionInput[]): SCDecision[] {
  return items.map(decideSCItem);
}
