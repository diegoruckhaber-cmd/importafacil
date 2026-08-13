export type FederalImportDate = `${number}-${number}-${number}`;

export type CofinsImportRule = {
  effectiveRate: number;
  displayRate: number;
  reason: "standard" | "reduced_benefit_2026" | "reduced_benefit_2026_plus_060";
};

/**
 * 2026 federal import rules that affect the PIS/Cofins-Importação calculation.
 * Rates are percentage points, not decimals.
 *
 * The Siscomex 025/2026 communication requires reduced Cofins benefits subject
 * to the 10% linear increase to be calculated at 0.965%, or 1.565% when the
 * additional 0.60 p.p. applies, even though DI may display 0.97% / 1.57%.
 */
export function resolveCofinsImport2026(input: {
  date: FederalImportDate;
  standardRate?: number;
  reducedBenefit?: boolean;
  additional060?: boolean;
}): CofinsImportRule {
  const standardRate = input.standardRate ?? 9.65;
  if (!input.reducedBenefit || input.date < "2026-04-01") {
    return { effectiveRate: standardRate, displayRate: standardRate, reason: "standard" };
  }

  if (input.additional060) {
    return { effectiveRate: 1.565, displayRate: 1.57, reason: "reduced_benefit_2026_plus_060" };
  }

  return { effectiveRate: 0.965, displayRate: 0.97, reason: "reduced_benefit_2026" };
}

export type FederalImportRegime =
  | "normal"
  | "drawback_suspension"
  | "drawback_exemption"
  | "reporto"
  | "retid"
  | "recine";

export type FederalRegimeResolution = {
  regime: FederalImportRegime;
  notes: string[];
  requiresSpecificLegalBasis: boolean;
  automaticZeroRates: boolean;
};

/**
 * Regime guardrail: special regimes are deliberately not reduced to a blind
 * zero-rate flag. The actual legal basis and eligibility must be resolved by
 * the product/operation context before tax is changed.
 */
export function resolveFederalRegime(regime: FederalImportRegime): FederalRegimeResolution {
  if (regime === "normal") {
    return { regime, notes: [], requiresSpecificLegalBasis: false, automaticZeroRates: false };
  }

  return {
    regime,
    notes: ["Regime especial selecionado: informar fundamento legal e validar elegibilidade antes de alterar alíquotas."],
    requiresSpecificLegalBasis: true,
    automaticZeroRates: false,
  };
}
