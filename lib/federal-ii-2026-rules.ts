export type IIFederalTreatment =
  | "integral"
  | "reduced_rate"
  | "benefit_10pct_reduction"
  | "suspension"
  | "exemption"
  | "conditional";

export type FederalIIResolution = {
  treatment: IIFederalTreatment;
  statutoryRate: number;
  effectiveRate: number;
  benefitReductionPercent: number;
  payableRate: number;
  warning?: string;
  source: string;
};

/**
 * Resolves the 2026 federal review layer for II without pretending that every
 * tariff benefit is automatically reduced. LC 224/2025 applies the 10% linear
 * reduction only to benefits within its statutory scope; the concrete legal
 * foundation must therefore be supplied by the operation.
 *
 * Rates are percentage points (e.g. 12 means 12%).
 */
export function resolveFederalII2026(input: {
  date: `${number}-${number}-${number}`;
  statutoryRate: number;
  legalFoundation?: string;
  benefitKind?: "none" | "reduced_rate" | "exemption" | "suspension";
  coveredByLC224?: boolean;
  exceptionToLC224?: boolean;
  reducedRate?: number;
}): FederalIIResolution {
  const source = input.legalFoundation
    ? `Fundamento legal informado: ${input.legalFoundation}`
    : "Fundamento legal do II não informado";

  if (input.benefitKind === "suspension") {
    return {
      treatment: "suspension",
      statutoryRate: input.statutoryRate,
      effectiveRate: 0,
      benefitReductionPercent: 0,
      payableRate: 0,
      warning: "Suspensão de II não equivale a benefício definitivo: o regime e suas condições devem ser validados separadamente.",
      source,
    };
  }

  if (input.benefitKind === "exemption") {
    if (input.coveredByLC224 && !input.exceptionToLC224 && input.date >= "2026-01-01") {
      return {
        treatment: "benefit_10pct_reduction",
        statutoryRate: input.statutoryRate,
        effectiveRate: input.statutoryRate * 0.1,
        benefitReductionPercent: 90,
        payableRate: input.statutoryRate * 0.1,
        warning: "Benefício de isenção sujeito à redução linear de 10% da LC 224/2025; validar o fundamento legal no rol aplicável.",
        source,
      };
    }
    return {
      treatment: "exemption",
      statutoryRate: input.statutoryRate,
      effectiveRate: 0,
      benefitReductionPercent: 100,
      payableRate: 0,
      source,
    };
  }

  if (input.benefitKind === "reduced_rate") {
    const baseRate = input.reducedRate ?? input.statutoryRate;
    if (input.coveredByLC224 && !input.exceptionToLC224 && input.date >= "2026-01-01") {
      const effectiveRate = baseRate + ((input.statutoryRate - baseRate) * 0.1);
      return {
        treatment: "benefit_10pct_reduction",
        statutoryRate: input.statutoryRate,
        effectiveRate,
        benefitReductionPercent: 90,
        payableRate: effectiveRate,
        warning: "Redução de benefício de II recalculada pela regra linear de 10% da LC 224/2025; validar o fundamento legal específico.",
        source,
      };
    }
    return {
      treatment: "reduced_rate",
      statutoryRate: input.statutoryRate,
      effectiveRate: baseRate,
      benefitReductionPercent: baseRate === 0 ? 100 : Math.max(0, (1 - baseRate / input.statutoryRate) * 100),
      payableRate: baseRate,
      source,
    };
  }

  if (input.coveredByLC224 && !input.exceptionToLC224 && input.date >= "2026-01-01") {
    return {
      treatment: "conditional",
      statutoryRate: input.statutoryRate,
      effectiveRate: input.statutoryRate,
      benefitReductionPercent: 0,
      payableRate: input.statutoryRate,
      warning: "Há indicação de benefício federal sujeito à LC 224/2025, mas a modalidade/fundamento não foi informado; nenhum benefício foi aplicado automaticamente.",
      source,
    };
  }

  return {
    treatment: "integral",
    statutoryRate: input.statutoryRate,
    effectiveRate: input.statutoryRate,
    benefitReductionPercent: 0,
    payableRate: input.statutoryRate,
    source,
  };
}
