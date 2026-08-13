export type SCOutputDestination = "commercial_resale" | "industrialization";

export type TTD77InteractionInput = {
  ttd409Or410: boolean;
  ttd77: boolean;
  destination: SCOutputDestination;
  importedUnderTTD409Or410: boolean;
  validTTD77: boolean;
  industrializationInSC?: boolean;
  sameNcmPositionAfterIndustrialization?: boolean;
};

export type TTD77InteractionDecision = {
  decision: "apply" | "deny" | "conditional";
  importTreatment: "ttd409_410" | "ttd77" | "conditional";
  outputTreatment: "commercial_ttd409_410" | "normal" | "conditional";
  reasons: string[];
  blockingIssues: string[];
};

/**
 * Models the interaction described in COPAT 19/2026.
 * It deliberately does not infer tax rates or a TTD 77 amount.
 */
export function decideTTD77Interaction(input: TTD77InteractionInput): TTD77InteractionDecision {
  if (!input.ttd409Or410 && !input.ttd77) {
    return {
      decision: "conditional",
      importTreatment: "conditional",
      outputTreatment: "conditional",
      reasons: ["Nenhum dos regimes TTD 409/410 ou TTD 77 foi informado."],
      blockingIssues: ["regime_required"],
    };
  }

  if (input.ttd77 && !input.validTTD77) {
    return {
      decision: "deny",
      importTreatment: input.ttd409Or410 ? "ttd409_410" : "conditional",
      outputTreatment: "normal",
      reasons: ["O TTD 77 foi informado, mas não há comprovação de sua validade."],
      blockingIssues: ["valid_ttd77_required"],
    };
  }

  if (input.ttd409Or410 && input.ttd77 && input.importedUnderTTD409Or410) {
    if (input.destination === "commercial_resale") {
      return {
        decision: "apply",
        importTreatment: "ttd409_410",
        outputTreatment: "commercial_ttd409_410",
        reasons: [
          "A importação pode permanecer integralmente sob TTD 409/410.",
          "Nas saídas comerciais, o tratamento favorecido do TTD 409/410 pode ser analisado.",
        ],
        blockingIssues: [],
      };
    }

    if (input.destination === "industrialization") {
      if (input.industrializationInSC === false) {
        return {
          decision: "deny",
          importTreatment: "ttd409_410",
          outputTreatment: "normal",
          reasons: [
            "A industrialização fora de Santa Catarina não preserva o crédito presumido do TTD 410 nas condições analisadas.",
          ],
          blockingIssues: ["industrialization_outside_sc"],
        };
      }

      if (input.industrializationInSC === undefined) {
        return {
          decision: "conditional",
          importTreatment: "ttd409_410",
          outputTreatment: "conditional",
          reasons: ["É necessário confirmar que a industrialização ocorrerá em Santa Catarina."],
          blockingIssues: ["industrialization_location_required"],
        };
      }

      if (input.sameNcmPositionAfterIndustrialization === false) {
        return {
          decision: "conditional",
          importTreatment: "ttd409_410",
          outputTreatment: "normal",
          reasons: ["A industrialização alterou a posição da NCM; o crédito presumido não deve ser aplicado automaticamente."],
          blockingIssues: ["ncm_position_changed"],
        };
      }

      return {
        decision: "conditional",
        importTreatment: "ttd409_410",
        outputTreatment: "normal",
        reasons: [
          "A mercadoria pode ter sido desembaraçada integralmente sob TTD 409/410.",
          "Para a saída destinada à industrialização, a tributação normal deve ser considerada, ressalvadas as condições específicas da legislação.",
        ],
        blockingIssues: ["industrial_output_adjustment"],
      };
    }
  }

  if (input.ttd77 && input.destination === "industrialization") {
    return {
      decision: "conditional",
      importTreatment: "ttd77",
      outputTreatment: "normal",
      reasons: ["TTD 77 selecionado para mercadoria destinada à industrialização; validar todas as condições do regime."],
      blockingIssues: ["ttd77_specific_conditions"],
    };
  }

  return {
    decision: "conditional",
    importTreatment: input.ttd409Or410 ? "ttd409_410" : input.ttd77 ? "ttd77" : "conditional",
    outputTreatment: "conditional",
    reasons: ["A combinação informada exige análise específica antes da aplicação automática."],
    blockingIssues: ["specific_regime_interaction"],
  };
}
