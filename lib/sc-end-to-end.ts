import { decideSCItem, type SCItemDecisionInput, type SCDecision } from "./sc-decision-engine.ts";
import { compareSCBenefit, type SCBenefitEffect } from "./sc-benefit-effects.ts";

export type SCEndToEndItem = SCItemDecisionInput & {
  normalICMS?: number;
  benefitICMS?: number;
  effect?: SCBenefitEffect;
};

export type SCEndToEndResult = {
  items: Array<{
    decision: SCDecision;
    comparison: ReturnType<typeof compareSCBenefit> | null;
  }>;
  totalNormalICMS: number;
  totalBenefitICMS: number | null;
  totalEstimatedSavings: number | null;
  status: "calculated" | "conditional" | "blocked";
};

export function runSCEndToEnd(items: SCEndToEndItem[]): SCEndToEndResult {
  if (items.length === 0) throw new Error("A operação deve possuir ao menos um item");

  const results = items.map((item) => {
    const decision = decideSCItem(item);
    const normal = item.normalICMS ?? 0;

    if (decision.decision === "deny") {
      return { decision, comparison: null };
    }

    if (decision.decision === "conditional") {
      const comparison = item.effect
        ? compareSCBenefit(normal, { ...item.effect, kind: "conditional" })
        : null;
      return { decision, comparison };
    }

    const comparison = item.effect
      ? compareSCBenefit(normal, item.effect, item.benefitICMS)
      : null;

    return { decision, comparison };
  });

  const normalTotal = results.reduce((sum, r) => sum + (r.comparison?.normalICMS ?? 0), 0);
  const calculated = results.filter((r) => r.comparison?.status === "calculated");
  const blocked = results.some((r) => r.decision.decision === "deny");
  const conditional = results.some((r) => r.decision.decision === "conditional" || r.comparison?.status === "conditional");

  const benefitTotal = calculated.reduce((sum, r) => sum + (r.comparison?.benefitICMS ?? 0), 0);
  const savingsTotal = calculated.reduce((sum, r) => sum + (r.comparison?.estimatedSavings ?? 0), 0);

  return {
    items: results,
    totalNormalICMS: normalTotal,
    totalBenefitICMS: conditional || blocked ? null : benefitTotal,
    totalEstimatedSavings: conditional || blocked ? null : savingsTotal,
    status: blocked ? "blocked" : conditional ? "conditional" : "calculated",
  };
}
