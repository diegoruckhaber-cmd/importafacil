export type TTDOutputInput = {
  ttd: 409 | 410;
  destination: "commercial_resale" | "industrialization" | "same_holder_transfer";
  industrializationInSC?: boolean;
  preservesOriginalCharacteristics?: boolean;
  sameNcmPosition?: boolean;
  taxableOutput?: boolean;
  otherDeferment?: boolean;
  paragraph23Or24?: boolean;
  equivalentTaxableEventElection?: boolean;
};

export type TTDOutputDecision = {
  decision: "apply" | "deny" | "conditional";
  presumedCreditEligible: boolean;
  partialDefermentEligible: boolean;
  reasons: string[];
  blockingIssues: string[];
};

export function decideTTD409410Output(input: TTDOutputInput): TTDOutputDecision {
  const reasons: string[] = [];
  const blockingIssues: string[] = [];

  if (input.taxableOutput === false) {
    return {
      decision: "deny",
      presumedCreditEligible: false,
      partialDefermentEligible: false,
      reasons: ["Não há saída tributada caracterizada."],
      blockingIssues: ["taxable_output_required"],
    };
  }

  if (input.otherDeferment === true && input.paragraph23Or24 !== true) {
    return {
      decision: "conditional",
      presumedCreditEligible: false,
      partialDefermentEligible: false,
      reasons: ["A saída possui outro diferimento; o crédito presumido não pode ser presumido como acumulável."],
      blockingIssues: ["other_deferment_compatibility"],
    };
  }

  if (input.destination === "same_holder_transfer") {
    if (input.equivalentTaxableEventElection !== true) {
      return {
        decision: "conditional",
        presumedCreditEligible: false,
        partialDefermentEligible: false,
        reasons: ["A transferência para estabelecimento do mesmo titular em outra UF exige verificação da opção pela equiparação a operação sujeita ao fato gerador."],
        blockingIssues: ["equivalent_taxable_event_election_required"],
      };
    }

    return {
      decision: "apply",
      presumedCreditEligible: true,
      partialDefermentEligible: false,
      reasons: ["Transferência para estabelecimento do mesmo titular com a condição de equiparação comprovada."],
      blockingIssues: [],
    };
  }

  if (input.destination === "industrialization") {
    const industrializationException =
      input.industrializationInSC === true &&
      input.preservesOriginalCharacteristics === true &&
      input.sameNcmPosition === true;

    if (!industrializationException) {
      return {
        decision: "conditional",
        presumedCreditEligible: false,
        partialDefermentEligible: false,
        reasons: ["Saída de produto resultante de industrialização; é necessário comprovar cumulativamente as condições específicas para exceção."],
        blockingIssues: ["industrialization_exception_conditions"],
      };
    }

    reasons.push("Industrialização em SC sem alteração das características originais e mantendo a mesma posição NCM.");
  }

  return {
    decision: "apply",
    presumedCreditEligible: true,
    partialDefermentEligible: input.paragraph23Or24 === true,
    reasons: [
      ...reasons,
      "Saída tributada subsequente tratada dentro do regime TTD 409/410, observadas as condições do ato concessivo.",
    ],
    blockingIssues,
  };
}
