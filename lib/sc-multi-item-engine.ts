import { decideSCItem, type SCItemDecisionInput, type SCDecision } from "./sc-decision-engine.ts";

export type SCMultiItemResult = {
  items: SCDecision[];
  overallStatus: "calculated" | "conditional" | "blocked";
  blockingItems: string[];
  conditionalItems: string[];
};

/**
 * Evaluates each import item independently. One uncertain item must never
 * silently contaminate another item's benefit decision.
 */
export function evaluateSCMultiItem(items: SCItemDecisionInput[]): SCMultiItemResult {
  if (!items.length) throw new Error("A operação deve possuir pelo menos um item");

  const decisions = items.map(decideSCItem);
  const blockingItems = decisions.filter(d => d.decision === "deny").map(d => d.itemId);
  const conditionalItems = decisions.filter(d => d.decision === "conditional").map(d => d.itemId);

  let overallStatus: SCMultiItemResult["overallStatus"] = "calculated";
  if (blockingItems.length) overallStatus = "blocked";
  else if (conditionalItems.length) overallStatus = "conditional";

  return { items: decisions, overallStatus, blockingItems, conditionalItems };
}
