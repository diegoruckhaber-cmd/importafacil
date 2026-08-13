import { getSCBenefitCatalogRule } from "./sc-benefit-catalog";
import { decideTTD409410Output } from "./sc-ttd409-410-output-rules";

export type SCBenefitResolutionInput = {
  ttd: 409 | 410;
  destination: "commercial_resale" | "industrialization" | "same_holder_transfer";
  taxableOutput?: boolean;
  industrializationInSC?: boolean;
  preservesOriginalCharacteristics?: boolean;
  sameNcmPosition?: boolean;
  otherDeferment?: boolean;
  paragraph23Or24?: boolean;
  equivalentTaxableEventElection?: boolean;
  normalOutputICMS: number;
};

export type SCBenefitResolution = {
  decision: "apply" | "conditional" | "deny";
  importDeferred: boolean;
  outputPresumedCredit: boolean;
  benefitICMS: number | null;
  estimatedSavings: number | null;
  reasons: string[];
  blockingIssues: string[];
  source: string;
};

/**
 * Resolves the legal treatment first and leaves the monetary percentage to the
 * validated concessive-act layer. This prevents the UI from treating a test
 * amount as if it were a statutory rate.
 */
export function resolveSCBenefit(input: SCBenefitResolutionInput): SCBenefitResolution {
  if (!Number.isFinite(input.normalOutputICMS) || input.normalOutputICMS < 0) {
    throw new Error("normalOutputICMS inválido");
  }

  const catalog = getSCBenefitCatalogRule(input.ttd);
  if (!catalog) {
    return {
      decision: "conditional",
      importDeferred: false,
      outputPresumedCredit: false,
      benefitICMS: null,
      estimatedSavings: null,
      reasons: ["Regra do TTD não encontrada no catálogo jurídico parametrizado."],
      blockingIssues: ["benefit_catalog_rule_missing"],
      source: "SC benefit catalog",
    };
  }

  const output = decideTTD409410Output({
    ttd: input.ttd,
    destination: input.destination,
    taxableOutput: input.taxableOutput,
    industrializationInSC: input.industrializationInSC,
    preservesOriginalCharacteristics: input.preservesOriginalCharacteristics,
    sameNcmPosition: input.sameNcmPosition,
    otherDeferment: input.otherDeferment,
    paragraph23Or24: input.paragraph23Or24,
    equivalentTaxableEventElection: input.equivalentTaxableEventElection,
  });

  const reasons = [...catalog.notes, ...output.reasons];
  if (output.decision !== "apply") {
    return {
      decision: output.decision,
      importDeferred: catalog.importDeferred,
      outputPresumedCredit: false,
      benefitICMS: null,
      estimatedSavings: null,
      reasons,
      blockingIssues: output.blockingIssues,
      source: catalog.source,
    };
  }

  return {
    decision: "apply",
    importDeferred: catalog.importDeferred,
    outputPresumedCredit: catalog.outputPresumedCredit && output.presumedCreditEligible,
    benefitICMS: null,
    estimatedSavings: null,
    reasons: [
      ...reasons,
      "Elegibilidade jurídica identificada. O valor monetário do crédito presumido depende do ato concessivo/regra econômica validada e ainda não foi inventado pelo sistema.",
    ],
    blockingIssues: [],
    source: catalog.source,
  };
}
