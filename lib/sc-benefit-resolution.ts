import { getSCBenefitCatalogRule } from "./sc-benefit-catalog";
import { decideTTD409410Output } from "./sc-ttd409-410-output-rules";
import { resolveScTtd } from "./sc-ttd-rule-catalog-2026";

export type SCBenefitResolutionInput = {
  ttd: 77 | 409 | 410;
  destination: "commercial_resale" | "industrialization" | "same_holder_transfer";
  /** Optional NCM used to activate the 2026 TTD guardrails. */
  ncm?: string;
  /** Known exclusion from Decreto SC nº 2.128/2009 / applicable act. */
  exclusionKnown?: boolean;
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

  // When NCM is available, apply the 2026 SC guardrail before the economic
  // benefit bridge. Unknown eligibility must never silently become eligible.
  if (input.ncm) {
    const destination = input.ttd === 77 || input.destination === "industrialization"
      ? "INDUSTRIALIZATION"
      : "COMMERCIALIZATION";
    const guardrail = resolveScTtd({
      ttd: String(input.ttd) as "77" | "409" | "410",
      destination,
      ncm: input.ncm,
      exclusionKnown: input.exclusionKnown,
    });

    if (!guardrail.eligible) {
      return {
        decision: "deny",
        importDeferred: false,
        outputPresumedCredit: false,
        benefitICMS: null,
        estimatedSavings: null,
        reasons: [...catalog.notes, ...guardrail.warnings],
        blockingIssues: ["sc_ttd_guardrail_failed"],
        source: [...guardrail.legalBasis, catalog.source].join("; "),
      };
    }
  }

  // TTD 77 is an import-stage industrialization deferral. It does not inherit
  // the TTD 409/410 presumed-credit logic at the output stage.
  if (input.ttd === 77) {
    const eligible = input.industrializationInSC === true;
    return {
      decision: eligible ? "apply" : "conditional",
      importDeferred: eligible,
      outputPresumedCredit: false,
      benefitICMS: null,
      estimatedSavings: null,
      reasons: eligible
        ? [...catalog.notes, "Industrialização em território catarinense comprovada; diferimento de entrada aplicável."]
        : [...catalog.notes, "O TTD 77 exige comprovação de destinação à industrialização em território catarinense."],
      blockingIssues: eligible ? [] : ["ttd77_industrialization_in_sc_required"],
      source: catalog.source,
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
    reasons: [...reasons, "Elegibilidade jurídica identificada. O valor monetário do crédito presumido depende do ato concessivo/regra econômica validada."],
    blockingIssues: [],
    source: catalog.source,
  };
}
