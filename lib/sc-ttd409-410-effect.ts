import type { SCBenefitEffect } from "./sc-benefit-effects.ts";

export type TTD409410OutputContext = {
  destination: "commercial_resale" | "industrialization";
  sameNcmPositionAfterFractionation?: boolean;
  industrializationInSC?: boolean;
  preservesOriginalCharacteristics?: boolean;
  outputOtherDeferment?: boolean;
  art246Paragraph23Or24?: boolean;
};

/**
 * TTD 409/410 effect descriptor.
 *
 * The legal regime is intentionally represented as separate import and output
 * effects. The actual percentage/carga must be supplied by the validated
 * regime catalog / concessive act and is never guessed here.
 */
export function describeTTD409410Effect(
  ttd: 409 | 410,
  context: TTD409410OutputContext,
): SCBenefitEffect {
  const notes = [
    `TTD ${ttd}: diferimento na etapa de importação e tratamento da saída subsequente devem ser analisados separadamente.`,
  ];

  if (context.destination === "industrialization") {
    notes.push(
      "Mercadoria destinada à industrialização: não presumir crédito presumido de saída; verificar o tratamento específico e as condições legais.",
    );
    return {
      kind: "conditional",
      creditOnOutput: false,
      notes,
    };
  }

  if (context.sameNcmPositionAfterFractionation === false) {
    notes.push(
      "Fracionamento com alteração da posição NCM: o crédito presumido não deve ser presumido para o produto resultante.",
    );
    return {
      kind: "conditional",
      creditOnOutput: false,
      notes,
    };
  }

  if (context.outputOtherDeferment === true && context.art246Paragraph23Or24 !== true) {
    notes.push(
      "Há outro diferimento na saída; a compatibilidade com o crédito presumido precisa ser resolvida antes do cálculo.",
    );
    return {
      kind: "conditional",
      creditOnOutput: false,
      notes,
    };
  }

  return {
    kind: "presumed_credit",
    creditOnOutput: true,
    notes,
  };
}
