export type MercosurEuPreferenceInput = {
  date: string;
  ncm: string;
  originCountry: string;
  standardIiRate: number;
  preferenceRequested?: boolean;
  originProofConfirmed?: boolean;
  preferentialIiRate?: number;
  quotaRequired?: boolean;
  quotaAvailable?: boolean;
};

export type MercosurEuPreferenceResolution = {
  potential: boolean;
  eligibleForCalculation: boolean;
  effectiveIiRate: number;
  appliedPreference: boolean;
  source: string;
  warnings: string[];
};

const EU_COUNTRIES = [
  "alemanha","austria","belgica","bulgaria","croacia","chipre","tchequia","republica tcheca","dinamarca",
  "estonia","finlandia","franca","grecia","hungria","irlanda","italia","letonia","lituania","luxemburgo",
  "malta","paises baixos","holanda","polonia","portugal","romenia","eslovaquia","eslovenia","espanha","suecia"
];

function normalize(value: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function isEuropeanUnionOrigin(originCountry: string) {
  return EU_COUNTRIES.includes(normalize(originCountry));
}

export function resolveMercosurEuImportPreference(input: MercosurEuPreferenceInput): MercosurEuPreferenceResolution {
  const standardIiRate = Number(input.standardIiRate);
  const source = "Acordo Provisório Mercosul-União Europeia — Decreto 12.953/2026 / Siscomex";
  const warnings: string[] = [];
  const potential = input.date >= "2026-05-01" && isEuropeanUnionOrigin(input.originCountry);

  if (!potential) {
    return { potential: false, eligibleForCalculation: false, effectiveIiRate: standardIiRate, appliedPreference: false, source, warnings };
  }

  if (input.preferenceRequested !== true) {
    warnings.push("Origem na União Europeia detectada. A TEC/II normal foi mantida porque a preferência Mercosul-UE não foi confirmada para esta operação.");
    return { potential: true, eligibleForCalculation: false, effectiveIiRate: standardIiRate, appliedPreference: false, source, warnings };
  }

  if (input.originProofConfirmed !== true) {
    warnings.push("A preferência Mercosul-UE foi indicada, mas a prova de origem preferencial não foi confirmada. A TEC/II normal foi mantida.");
    return { potential: true, eligibleForCalculation: false, effectiveIiRate: standardIiRate, appliedPreference: false, source, warnings };
  }

  if (input.quotaRequired === true && input.quotaAvailable !== true) {
    warnings.push("A preferência Mercosul-UE depende de cota, mas a disponibilidade não foi confirmada. A TEC/II normal foi mantida.");
    return { potential: true, eligibleForCalculation: false, effectiveIiRate: standardIiRate, appliedPreference: false, source, warnings };
  }

  const preferential = Number(input.preferentialIiRate);
  if (!Number.isFinite(preferential) || preferential < 0 || preferential > 100) {
    warnings.push("A preferência Mercosul-UE foi confirmada, mas falta a alíquota preferencial final aplicável à NCM/data. A TEC/II normal foi mantida.");
    return { potential: true, eligibleForCalculation: false, effectiveIiRate: standardIiRate, appliedPreference: false, source, warnings };
  }

  const effectiveIiRate = Math.min(standardIiRate, preferential);
  if (effectiveIiRate === standardIiRate) {
    warnings.push("A alíquota preferencial informada não é inferior à TEC vigente; foi mantida a menor alíquota aplicável.");
  }

  return {
    potential: true,
    eligibleForCalculation: true,
    effectiveIiRate,
    appliedPreference: effectiveIiRate < standardIiRate,
    source,
    warnings,
  };
}
