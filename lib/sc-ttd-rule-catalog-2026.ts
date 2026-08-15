export type ScTtdCode = "409" | "410" | "77";
export type ScDestination = "COMMERCIALIZATION" | "INDUSTRIALIZATION";

export type ScTtdResolution = {
  ttd: ScTtdCode;
  eligible: boolean;
  importTreatment: "DEFERRED" | "NORMAL";
  subsequentTreatment: "PRESUMED_CREDIT" | "NORMAL" | "NOT_APPLICABLE";
  warnings: string[];
  legalBasis: string[];
};

/** SC 2026 rule guardrails; unknown NCM eligibility fails closed. */
export const SC_TTD_RULE_VERSION = "2026-08-15";
export const SC_TTD_RULE_SOURCES = [
  "RICMS/SC-01, Anexo 2, art. 246",
  "RICMS/SC-01, Anexo 3, art. 10",
  "Decreto SC nº 2.128/2009",
  "COPAT 010/2026",
  "COPAT 019/2026",
  "COPAT 029/2026",
] as const;

export function resolveScTtd(input: { ttd: ScTtdCode; destination: ScDestination; ncm: string; exclusionKnown?: boolean }): ScTtdResolution {
  const ncm = input.ncm.replace(/[^0-9]/g, "");
  const basis = [...SC_TTD_RULE_SOURCES];
  if (!ncm) return { ttd: input.ttd, eligible: false, importTreatment: "NORMAL", subsequentTreatment: "NOT_APPLICABLE", warnings: ["NCM não informada; não aplicar TTD automaticamente."], legalBasis: basis };
  if (input.exclusionKnown === true) return { ttd: input.ttd, eligible: false, importTreatment: "NORMAL", subsequentTreatment: "NORMAL", warnings: [`NCM ${ncm} marcada como excluída/vedada para o tratamento informado.`], legalBasis: basis };
  if (input.ttd === "77") {
    if (input.destination !== "INDUSTRIALIZATION") return { ttd: "77", eligible: false, importTreatment: "NORMAL", subsequentTreatment: "NOT_APPLICABLE", warnings: ["TTD 77 foi solicitado fora da destinação de industrialização."], legalBasis: basis };
    return { ttd: "77", eligible: true, importTreatment: "DEFERRED", subsequentTreatment: "NORMAL", warnings: ["Validar ato concessivo e enquadramento da mercadoria como matéria-prima, material intermediário ou secundário."], legalBasis: basis };
  }
  if (input.destination !== "COMMERCIALIZATION") return { ttd: input.ttd, eligible: false, importTreatment: "NORMAL", subsequentTreatment: "NORMAL", warnings: ["TTD 409/410 do art. 246 foi modelado para importação destinada à comercialização; para industrialização, avaliar o tratamento próprio."], legalBasis: basis };
  return { ttd: input.ttd, eligible: true, importTreatment: "DEFERRED", subsequentTreatment: "PRESUMED_CREDIT", warnings: ["Validar ato concessivo e lista de mercadorias excluídas do Decreto 2.128/2009 antes do cálculo definitivo."], legalBasis: basis };
}
