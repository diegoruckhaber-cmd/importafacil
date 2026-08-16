import { SC_IMPORT_SPECIAL_REGIMES_2026 } from "./sc-import-special-regimes";

type Candidate = {
  id: string;
  title: string;
  legalBasis: string;
  status: string;
  confidence: "high" | "medium";
  reasons: string[];
  treatment: unknown;
};

function normalizeNcm(value: string) {
  return value.replace(/\D/g, "");
}

export function discoverScTreatments(input: { ncm: string; destination: string; origin?: string }): Candidate[] {
  const ncm = normalizeNcm(input.ncm);
  if (ncm.length !== 8) return [];
  const candidates: Candidate[] = [];

  for (const rule of SC_IMPORT_SPECIAL_REGIMES_2026) {
    const reasons: string[] = [];
    let confidence: Candidate["confidence"] = "medium";
    const ncmConditions = rule.conditions.filter((c) => c.field === "product.ncm" && c.operator === "eq");
    const ncmExact = ncmConditions.some((c) => normalizeNcm(String(c.value ?? "")) === ncm);
    if (ncmConditions.length > 0 && !ncmExact) continue;
    if (ncmExact) { reasons.push("A NCM informada coincide exatamente com a NCM prevista na regra."); confidence = "high"; }

    const purpose = input.destination === "industrialization" ? "industrialization" : "resale";
    const purposeConditions = rule.conditions.filter((c) => c.field === "purpose");
    if (purposeConditions.length > 0) {
      const purposeMatch = purposeConditions.some((c) => (c.operator === "eq" && c.value === purpose) || (c.operator === "in" && Array.isArray(c.value) && c.value.includes(purpose)));
      if (!purposeMatch) continue;
      reasons.push(input.destination === "industrialization" ? "A destinação informada é industrialização." : "A destinação informada é revenda/comercialização.");
    }

    if (input.origin) {
      const agreementCondition = rule.conditions.find((c) => c.field === "origin.countryIsPartyToNonDiscriminationAgreement");
      if (agreementCondition) reasons.push("A origem foi informada; confirme se o país atende ao requisito de não discriminação antes de aplicar o tratamento.");
    }

    if (rule.id.includes("ART10") && !ncmExact && purposeConditions.length === 0) continue;
    if (reasons.length === 0) continue;
    candidates.push({ id: rule.id, title: rule.title, legalBasis: rule.legalBasis, status: rule.status, confidence, reasons, treatment: rule.treatment });
  }
  return candidates.slice(0, 8);
}
