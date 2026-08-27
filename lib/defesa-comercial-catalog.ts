export type DefenseCommercialUnit = "USD_PER_KG" | "USD_PER_TON" | "USD_PER_UNIT" | "USD_PER_THOUSAND_UNITS" | "AD_VALOREM";

export type DefenseCommercialExporterOption = {
  exporter: string;
  rate: number;
  unit: DefenseCommercialUnit;
  collectionSuspended?: boolean;
};

export type DefenseCommercialMeasure = {
  ncm: string;
  product: string;
  origins: string[];
  measure: "antidumping";
  legalFoundation: string;
  source: string;
  validityNote: string;
  exportersByOrigin: Record<string, DefenseCommercialExporterOption[]>;
};

const normalize = (value: string) =>
  value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const DEFENSE_COMMERCIAL_MEASURES: DefenseCommercialMeasure[] = [
  {
    ncm: "40112090",
    product: "Pneus de carga de construção radial",
    origins: ["China", "Coreia do Sul", "Japão", "Rússia", "Tailândia"],
    measure: "antidumping",
    legalFoundation: "Resolução GECEX nº 198/2021; Resolução GECEX nº 176/2021; Resolução GECEX nº 540/2023; Circular SECEX nº 20/2026",
    source: "MDIC/SECEX — Medidas em vigor: Pneus de carga",
    validityNote: "Medida mantida em vigor durante revisão de final de período.",
    exportersByOrigin: {
      china: [
        { exporter: "Shandong Linglong Tyre Co., Ltd.", rate: 1.05, unit: "USD_PER_KG" },
        { exporter: "Triangle Tyre Co., Ltd.", rate: 1.07, unit: "USD_PER_KG" },
        { exporter: "Zhongce Rubber Group Co., Ltd.", rate: 1.12, unit: "USD_PER_KG" },
        { exporter: "Double Coin Holdings Ltd.", rate: 1.12, unit: "USD_PER_KG" },
        { exporter: "Giti Tire (Anhui) Co., Ltd.", rate: 1.31, unit: "USD_PER_KG" },
        { exporter: "Giti Tire (Chongqing) Company Ltd.", rate: 1.31, unit: "USD_PER_KG" },
        { exporter: "Giti Tire (Fujian) Company Ltd.", rate: 1.31, unit: "USD_PER_KG" },
        { exporter: "Aeolus Tyre Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Chaoyang Long March Tyre Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Cooper Chengshan (Shandong) Tire Company Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Guangming Tyre Group Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Jiangsu Hankook Tire Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Michelin Shenyang Tire Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Pirelli Tyre Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Sailun Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Sailun Jinyu Group Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Shandong Jinyu Tire Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Shandong Changfeng Tyres Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Shandong Hengyu Rubber Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Shandong Longyue Rubber Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Shandong Wanda Boto Tyre Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Shenyang Peace Radial Tyre Manufacturing Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Shouguang Firemax Tyre Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Sinotyre International Group Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Triangle (Weihai) Huamao Rubber Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Zhaoqing Junhong Co., Ltd.", rate: 1.42, unit: "USD_PER_KG" },
        { exporter: "Shandong Bayi Tyre Manufacture Co., Ltd.", rate: 1.55, unit: "USD_PER_KG" },
        { exporter: "Demais empresas", rate: 2.59, unit: "USD_PER_KG" },
      ],
      "coreia do sul": [
        { exporter: "Kumho Tires Co. Inc.", rate: 0.32, unit: "USD_PER_KG" },
        { exporter: "Hankook Tire Co., Ltd.", rate: 0.51, unit: "USD_PER_KG" },
        { exporter: "Demais empresas", rate: 1.49, unit: "USD_PER_KG" },
      ],
      japao: [
        { exporter: "Sumitomo Rubber Industries", rate: 0.21, unit: "USD_PER_KG", collectionSuspended: true },
        { exporter: "Demais empresas", rate: 1.59, unit: "USD_PER_KG", collectionSuspended: true },
      ],
      russia: [
        { exporter: "OAO Cordiant", rate: 1.10, unit: "USD_PER_KG" },
        { exporter: "Demais empresas", rate: 0.72, unit: "USD_PER_KG" },
      ],
      tailandia: [
        { exporter: "Zhongce Rubber Co. Ltd", rate: 0.55, unit: "USD_PER_KG" },
        { exporter: "Demais empresas", rate: 0.53, unit: "USD_PER_KG" },
      ],
    },
  },
];

export function findDefenseCommercialMeasure(ncm: string, origin: string, importDate?: string) {
  const normalizedNcm = ncm.replace(/\D/g, "");
  const normalizedOrigin = normalize(origin);
  const measure = DEFENSE_COMMERCIAL_MEASURES.find(
    (candidate) => candidate.ncm === normalizedNcm && candidate.origins.some((item) => normalize(item) === normalizedOrigin),
  );
  if (!measure) return undefined;
  return { ...measure, importDate };
}

export function listDefenseCommercialExporters(ncm: string, origin: string, importDate?: string) {
  const measure = findDefenseCommercialMeasure(ncm, origin, importDate);
  if (!measure) return null;
  const options = measure.exportersByOrigin[normalize(origin)] ?? [];
  return { measure, options };
}

export function resolveDefenseCommercialExporter(ncm: string, origin: string, exporter?: string, importDate?: string) {
  const result = listDefenseCommercialExporters(ncm, origin, importDate);
  if (!result) return undefined;
  const normalizedExporter = normalize(exporter ?? "");
  if (!normalizedExporter) return result.options.find((option) => normalize(option.exporter) === "demais empresas") ?? result.options.at(-1);
  return result.options.find((option) => normalize(option.exporter) === normalizedExporter);
}
