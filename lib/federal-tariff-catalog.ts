export type FederalTariffSource =
  | "TEC"
  | "LECAM"
  | "LETEC"
  | "LEBIT_BK"
  | "ABASTECIMENTO"
  | "DCC"
  | "ACE14"
  | "OMC"
  | "EX_TARIFARIO"
  | "MERCOSUL_EU";

export type FederalTariffEntry = {
  ncm: string;
  rate: number;
  source: FederalTariffSource;
  validFrom: string;
  validTo?: string;
  legalBasis: string;
  priority: number;
  quota?: {
    applicable: boolean;
    authorizationRequired: boolean;
  };
};

export type FederalTariffResolution = {
  ncm: string;
  rate: number | null;
  source: FederalTariffSource | null;
  legalBasis: string | null;
  automatic: boolean;
  warnings: string[];
};

/**
 * Versioned federal tariff layer.
 *
 * The official MDIC tariff base contains TEC plus Brazilian exceptions,
 * quotas and temporary mechanisms. This module deliberately separates the
 * data layer from the resolver so updates to the official spreadsheets can be
 * loaded without changing tax-calculation code.
 *
 * Rates are percentage points (12 means 12%). Dates are ISO calendar dates.
 * A missing NCM is never treated as a zero rate.
 */
export const FEDERAL_TARIFF_CATALOG_VERSION = "2026-07-24";
export const FEDERAL_TARIFF_CATALOG: FederalTariffEntry[] = [];

function normalizeNcm(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

function isActive(entry: FederalTariffEntry, date: string): boolean {
  return entry.validFrom <= date && (!entry.validTo || date <= entry.validTo);
}

/**
 * Resolve the applicable federal II rate from the versioned catalog.
 *
 * Precedence is explicit: a more specific Brazilian exception/temporary
 * treatment wins over the TEC entry when both are active. Equal-priority
 * competing entries are considered ambiguous rather than guessed.
 */
export function resolveFederalTariff(input: {
  ncm: string;
  date: `${number}-${number}-${number}`;
  catalog?: FederalTariffEntry[];
}): FederalTariffResolution {
  const ncm = normalizeNcm(input.ncm);
  const catalog = input.catalog ?? FEDERAL_TARIFF_CATALOG;
  const active = catalog.filter((entry) => normalizeNcm(entry.ncm) === ncm && isActive(entry, input.date));

  if (active.length === 0) {
    return {
      ncm,
      rate: null,
      source: null,
      legalBasis: null,
      automatic: false,
      warnings: [
        `NCM ${ncm || "não informada"} não localizada no catálogo tarifário federal versionado (${FEDERAL_TARIFF_CATALOG_VERSION}).`,
        "Não aplicar II automaticamente; consultar a fonte oficial vigente.",
      ],
    };
  }

  const highestPriority = Math.max(...active.map((entry) => entry.priority));
  const winners = active.filter((entry) => entry.priority === highestPriority);

  if (winners.length !== 1) {
    return {
      ncm,
      rate: null,
      source: null,
      legalBasis: null,
      automatic: false,
      warnings: [
        `Há ${winners.length} tratamentos tarifários ativos com a mesma prioridade para a NCM ${ncm}.`,
        "Resolver a concorrência pela base legal/condição específica antes de aplicar o II.",
      ],
    };
  }

  const winner = winners[0];
  const warnings: string[] = [];
  if (winner.quota?.applicable && winner.quota.authorizationRequired) {
    warnings.push("Tratamento sujeito a cota/autorização: validar saldo e habilitação antes do cálculo definitivo.");
  }

  return {
    ncm,
    rate: winner.rate,
    source: winner.source,
    legalBasis: winner.legalBasis,
    automatic: warnings.length === 0,
    warnings,
  };
}

/**
 * Utility for importing normalized official tariff rows into the resolver.
 * Keeping this transformation pure makes it suitable for a later scheduled
 * data-refresh job without coupling the fiscal engine to XLSX parsing.
 */
export function normalizeFederalTariffRows(rows: Array<{
  ncm: string;
  rate: number;
  source: FederalTariffSource;
  validFrom: string;
  validTo?: string;
  legalBasis: string;
  priority?: number;
  quotaApplicable?: boolean;
  quotaAuthorizationRequired?: boolean;
}>): FederalTariffEntry[] {
  return rows.map((row) => ({
    ncm: normalizeNcm(row.ncm),
    rate: row.rate,
    source: row.source,
    validFrom: row.validFrom,
    validTo: row.validTo,
    legalBasis: row.legalBasis,
    priority: row.priority ?? 100,
    quota: row.quotaApplicable
      ? {
          applicable: true,
          authorizationRequired: row.quotaAuthorizationRequired ?? false,
        }
      : undefined,
  }));
}
