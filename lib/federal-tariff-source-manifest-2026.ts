export type FederalTariffSourceLayer = {
  key: "TEC" | "LECAM" | "LETEC" | "LEBIT_BK" | "ABASTECIMENTO" | "OMC" | "DCC" | "ACE14" | "EX_TARIFARIO";
  priority: number;
  description: string;
};

/**
 * Source contract for the federal tariff resolver.
 * The MDIC page publishes a consolidated workbook containing Annexes I–X
 * and separately points to the tariff panel for quotas, Ex-tarifários and
 * other mechanisms. This manifest keeps that hierarchy explicit so a future
 * full-data loader cannot silently collapse exceptions into the TEC rate.
 */
export const FEDERAL_TARIFF_SOURCE_MANIFEST_VERSION = "2026-08-12";
export const FEDERAL_TARIFF_OFFICIAL_PAGE = "https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes";
export const FEDERAL_TARIFF_PANEL = "https://www.gov.br/mdic/pt-br/assuntos/camex/360/painel-tarifario";

export const FEDERAL_TARIFF_SOURCE_LAYERS: FederalTariffSourceLayer[] = [
  { key: "EX_TARIFARIO", priority: 300, description: "Ex-tarifário aplicável ao enquadramento específico." },
  { key: "ABASTECIMENTO", priority: 290, description: "Redução tarifária por razões de abastecimento." },
  { key: "LETEC", priority: 280, description: "Lista Brasileira de Exceções à TEC." },
  { key: "LEBIT_BK", priority: 270, description: "Lista de exceções de BIT/BK." },
  { key: "DCC", priority: 260, description: "Elevação tarifária por desequilíbrio comercial." },
  { key: "ACE14", priority: 250, description: "Exceções temporárias do ACE-14." },
  { key: "OMC", priority: 240, description: "Concessões tarifárias decorrentes de compromissos OMC." },
  { key: "LECAM", priority: 230, description: "Tratamento brasileiro específico da CAMEX." },
  { key: "TEC", priority: 100, description: "Tarifa Externa Comum como base residual." },
];

export const FEDERAL_TARIFF_CATALOG_STATUS = {
  productionReady: false,
  reason: "O repositório ainda contém apenas sementes validadas; a carga integral do workbook oficial precisa ser versionada antes de tratar ausência de NCM como tarifa TEC.",
} as const;

export function getFederalTariffSourcePriority(source: FederalTariffSourceLayer["key"]): number {
  return FEDERAL_TARIFF_SOURCE_LAYERS.find((item) => item.key === source)?.priority ?? 0;
}
