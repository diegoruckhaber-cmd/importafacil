import { calculateTributaryOperation, type TributaryOperation, type TributaryResult } from "./tributary-engine.ts";
import { decideSCItem, type SCItemDecisionInput, type SCDecision } from "./sc-decision-engine.ts";

export type SCIntegratedItem = SCItemDecisionInput & {
  tributary: TributaryOperation;
};

export type SCIntegratedResult = {
  decision: SCDecision;
  taxes: TributaryResult | null;
};

/**
 * Connects the legal/eligibility layer to the mathematical tax engine.
 * Tax calculation is intentionally performed only when the SC decision is
 * "apply". Conditional/denied cases return no tax result rather than
 * calculating an amount under an unverified benefit.
 */
export function calculateSCItem(input: SCIntegratedItem): SCIntegratedResult {
  const decision = decideSCItem(input);

  if (decision.decision !== "apply") {
    return { decision, taxes: null };
  }

  return {
    decision,
    taxes: calculateTributaryOperation(input.tributary),
  };
}

export function calculateSCItems(inputs: SCIntegratedItem[]): SCIntegratedResult[] {
  return inputs.map(calculateSCItem);
}
