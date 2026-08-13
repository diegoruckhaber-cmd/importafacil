export type FederalFoundationEntry = {
  code: string;
  regime: "REPORTO" | "RETID" | "RECINE" | "DRAWBACK" | "OTHER";
  taxes: Array<"II" | "IPI" | "PIS" | "COFINS">;
  forProfit: boolean | null;
  requiresSpecificEligibility: boolean;
  notes: string;
  administrativeAlert?: string;
};

/**
 * Versioned catalog of federal import foundations that were materially
 * updated/created in 2026. This catalog is intentionally descriptive: it
 * does not turn a foundation into an automatic tax benefit. The operation
 * must still prove eligibility and the applicable legal treatment.
 */
export const FEDERAL_2026_FOUNDATIONS: FederalFoundationEntry[] = [
  { code: "1074", regime: "REPORTO", taxes: ["II"], forProfit: true, requiresSpecificEligibility: true, notes: "Reporto — entidade com fins lucrativos — II.", },
  { code: "1075", regime: "REPORTO", taxes: ["IPI", "PIS", "COFINS"], forProfit: true, requiresSpecificEligibility: true, notes: "Reporto — entidade com fins lucrativos — IPI, PIS e Cofins.", },
  { code: "1079", regime: "REPORTO", taxes: ["II"], forProfit: false, requiresSpecificEligibility: true, notes: "Reporto — entidade sem fins lucrativos — II.", },
  { code: "1080", regime: "REPORTO", taxes: ["IPI", "PIS", "COFINS"], forProfit: false, requiresSpecificEligibility: true, notes: "Reporto — entidade sem fins lucrativos — IPI, PIS e Cofins.", },
  { code: "1400", regime: "RETID", taxes: ["IPI"], forProfit: true, requiresSpecificEligibility: true, notes: "RETID — entidade com fins lucrativos — IPI.", },
  { code: "1401", regime: "RETID", taxes: ["IPI"], forProfit: false, requiresSpecificEligibility: true, notes: "RETID — entidade sem fins lucrativos.", },
  { code: "1403", regime: "RETID", taxes: ["PIS", "COFINS"], forProfit: true, requiresSpecificEligibility: true, notes: "RETID — entidade com fins lucrativos — PIS e Cofins.", },
  { code: "1123", regime: "RECINE", taxes: ["II", "IPI"], forProfit: true, requiresSpecificEligibility: true, notes: "RECINE — entidade com fins lucrativos — II e IPI.", },
  { code: "1124", regime: "RECINE", taxes: ["PIS", "COFINS"], forProfit: true, requiresSpecificEligibility: true, notes: "RECINE — entidade com fins lucrativos — PIS e Cofins.", },
  { code: "1118", regime: "RECINE", taxes: ["II", "IPI", "PIS", "COFINS"], forProfit: false, requiresSpecificEligibility: true, notes: "RECINE — entidade sem fins lucrativos.", },
  { code: "0920", regime: "DRAWBACK", taxes: ["II", "IPI", "PIS", "COFINS"], forProfit: null, requiresSpecificEligibility: true, notes: "Drawback Suspensão Contínuo.", administrativeAlert: "Desde 01/06/2026, sujeito à anuência do Inmetro quando enquadrado no tratamento administrativo comunicado pelo Siscomex." },
  { code: "1009", regime: "DRAWBACK", taxes: ["II", "IPI", "PIS", "COFINS"], forProfit: null, requiresSpecificEligibility: true, notes: "Drawback Isenção.", administrativeAlert: "Desde 01/06/2026, sujeito à anuência do Inmetro quando enquadrado no tratamento administrativo comunicado pelo Siscomex." },
  { code: "1016", regime: "DRAWBACK", taxes: ["II", "IPI", "PIS", "COFINS"], forProfit: null, requiresSpecificEligibility: true, notes: "Drawback Suspensão.", administrativeAlert: "Desde 01/06/2026, sujeito à anuência do Inmetro quando enquadrado no tratamento administrativo comunicado pelo Siscomex." },
  { code: "1021", regime: "DRAWBACK", taxes: ["IPI", "PIS", "COFINS"], forProfit: null, requiresSpecificEligibility: true, notes: "Drawback Isenção — redução a zero de IPI, PIS/Pasep-Importação e Cofins-Importação.", administrativeAlert: "O tratamento tributário não deve ser inferido apenas pelo código; validar o ato/concessão e o tratamento administrativo." },
];

export function findFederal2026Foundation(code?: string): FederalFoundationEntry | undefined {
  if (!code) return undefined;
  return FEDERAL_2026_FOUNDATIONS.find((entry) => entry.code === code);
}

export function validateFederal2026Foundation(input: {
  code?: string;
  forProfit?: boolean;
  tax: "II" | "IPI" | "PIS" | "COFINS";
}): { valid: boolean; entry?: FederalFoundationEntry; warnings: string[] } {
  const entry = findFederal2026Foundation(input.code);
  if (!entry) {
    return { valid: false, warnings: ["Fundamento federal 2026 não localizado no catálogo versionado; não aplicar benefício automaticamente."] };
  }

  const warnings: string[] = [];
  if (!entry.taxes.includes(input.tax)) {
    warnings.push(`O fundamento ${entry.code} não está catalogado para ${input.tax}.`);
  }
  if (entry.forProfit !== null && input.forProfit !== undefined && entry.forProfit !== input.forProfit) {
    warnings.push(`O fundamento ${entry.code} exige a classificação de entidade ${entry.forProfit ? "com" : "sem"} fins lucrativos.`);
  }
  if (entry.requiresSpecificEligibility) {
    warnings.push("Validar habilitação, ato concessivo e demais condições do regime antes de aplicar o tratamento tributário.");
  }
  if (entry.administrativeAlert) warnings.push(entry.administrativeAlert);

  return { valid: warnings.every((warning) => !warning.includes("não está catalogado")), entry, warnings };
}
