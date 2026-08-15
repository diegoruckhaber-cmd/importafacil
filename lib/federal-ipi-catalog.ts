export type FederalIpiEntry = {
  ncm: string;
  rate: number;
  validFrom: string;
  validTo?: string;
  legalBasis: string;
};

/** Receita Federal TIPI source. The current published XLSX was updated 13/02/2026. */
export const FEDERAL_IPI_CATALOG_VERSION = "2026-02-13";
export const FEDERAL_IPI_SOURCE_URL = "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/documentos-e-arquivos/tipi.xlsx/view";

/** Validated smoke row only; complete TIPI workbook is still a data-loading task. */
export const FEDERAL_IPI_CATALOG: FederalIpiEntry[] = [
  {
    ncm: "32081020",
    rate: 3.25,
    validFrom: "2026-02-13",
    legalBasis: "TIPI 2022 — ADE RFB nº 001/2026",
  },
];

function normalizeNcm(value: string): string { return value.replace(/[^0-9]/g, ""); }

export function resolveFederalIpi(input: { ncm: string; date: `${number}-${number}-${number}`; catalog?: FederalIpiEntry[] }) {
  const ncm = normalizeNcm(input.ncm);
  const catalog = input.catalog ?? FEDERAL_IPI_CATALOG;
  const matches = catalog.filter((entry) => normalizeNcm(entry.ncm) === ncm && entry.validFrom <= input.date && (!entry.validTo || input.date <= entry.validTo));
  if (matches.length !== 1) {
    return {
      ncm,
      rate: null as number | null,
      automatic: false,
      legalBasis: null as string | null,
      warnings: [matches.length === 0 ? `NCM ${ncm || "não informada"} não localizada no catálogo TIPI versionado (${FEDERAL_IPI_CATALOG_VERSION}).` : `Há ${matches.length} tratamentos TIPI ativos para a NCM ${ncm}; resolver a vigência antes de aplicar o IPI.`],
    };
  }
  const entry = matches[0];
  return { ncm, rate: entry.rate, automatic: true, legalBasis: entry.legalBasis, warnings: [] as string[] };
}
