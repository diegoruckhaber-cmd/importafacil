type RuleCondition = { field: string; operator: string; value?: unknown };

export type ScSpecialImportRule = {
  id: string;
  title: string;
  legalBasis: string;
  source: string;
  effectiveFrom: string;
  status: 'validated' | 'conditional' | 'requires_lookup';
  conditions: RuleCondition[];
  treatment: { importDeferral?: 'full' | 'partial' | 'none'; importExemption?: boolean; notes?: string[] };
};

/** Import-specific SC regimes outside the TTD 409/410 catalog. */
export const SC_IMPORT_SPECIAL_REGIMES_2026: ScSpecialImportRule[] = [
  { id: 'SC-AN3-ART10-I-AGRO', title: 'Diferimento na importação de insumos agropecuários', legalBasis: 'RICMS/SC-01, Anexo 3, art. 10, I', source: 'https://legislacao.sef.sc.gov.br/legtrib_internet/html/regulamentos/icms/ricms_01_03_pas.htm', effectiveFrom: '2004-08-12', status: 'conditional', conditions: [
    { field: 'operation.kind', operator: 'eq', value: 'import_entry' }, { field: 'specialRegime.art10', operator: 'eq', value: true }, { field: 'purpose', operator: 'in', value: ['agriculture', 'livestock'] }, { field: 'product.importArt10Category', operator: 'eq', value: 'agro_inputs' }, { field: 'importer.isRegisteredInSC', operator: 'eq', value: true }, { field: 'customs.entryState', operator: 'eq', value: 'SC' }
  ], treatment: { importDeferral: 'full', notes: ['Regime especial e conferência do produto por NCM/descrição são necessários.'] } },
  { id: 'SC-AN3-ART10-II-INDUSTRIAL', title: 'Diferimento de matéria-prima, material intermediário ou secundário', legalBasis: 'RICMS/SC-01, Anexo 3, art. 10, II', source: 'https://legislacao.sef.sc.gov.br/legtrib_internet/html/regulamentos/icms/ricms_01_03_pas.htm', effectiveFrom: '2004-08-12', status: 'conditional', conditions: [
    { field: 'operation.kind', operator: 'eq', value: 'import_entry' }, { field: 'specialRegime.art10', operator: 'eq', value: true }, { field: 'purpose', operator: 'eq', value: 'industrialization' }, { field: 'industrializationState', operator: 'eq', value: 'SC' }, { field: 'customs.entryState', operator: 'eq', value: 'SC' }
  ], treatment: { importDeferral: 'full', notes: ['Regime especial concedido pelo Diretor de Administração Tributária.'] } },
  { id: 'SC-AN3-ART10-III-COMMERCIAL', title: 'Diferimento de importação para comercialização', legalBasis: 'RICMS/SC-01, Anexo 3, art. 10, III', source: 'https://legislacao.sef.sc.gov.br/legtrib_internet/html/regulamentos/icms/ricms_01_03_pas.htm', effectiveFrom: '2004-08-12', status: 'conditional', conditions: [
    { field: 'operation.kind', operator: 'eq', value: 'import_entry' }, { field: 'specialRegime.art10', operator: 'eq', value: true }, { field: 'purpose', operator: 'eq', value: 'resale' }, { field: 'customs.entryState', operator: 'eq', value: 'SC' }, { field: 'importer.radarEnabled', operator: 'eq', value: true }, { field: 'importer.guaranteeProvided', operator: 'eq', value: true }
  ], treatment: { importDeferral: 'full', notes: ['Condições, garantia e ato concessivo devem ser confirmados.'] } },
  { id: 'SC-AN3-ART10-IV-ACTIVE', title: 'Conversores/decodificadores para ativo imobilizado', legalBasis: 'RICMS/SC-01, Anexo 3, art. 10, IV', source: 'https://legislacao.sef.sc.gov.br/legtrib_internet/html/regulamentos/icms/ricms_01_03_pas.htm', effectiveFrom: '2004-08-12', status: 'requires_lookup', conditions: [
    { field: 'operation.kind', operator: 'eq', value: 'import_entry' }, { field: 'specialRegime.art10', operator: 'eq', value: true }, { field: 'product.ncm', operator: 'eq', value: '8543.89.90' }, { field: 'purpose', operator: 'eq', value: 'fixed_asset' }, { field: 'customs.entryState', operator: 'eq', value: 'SC' }
  ], treatment: { importDeferral: 'full', notes: ['Encerramento na alienação ou no 24º mês, o que ocorrer primeiro.'] } },
  { id: 'SC-AN3-ART10-V-REB', title: 'Insumos, materiais e equipamentos para embarcações REB', legalBasis: 'RICMS/SC-01, Anexo 3, art. 10, V', source: 'https://legislacao.sef.sc.gov.br/legtrib_internet/html/regulamentos/icms/ricms_01_03_pas.htm', effectiveFrom: '2004-08-12', status: 'conditional', conditions: [
    { field: 'operation.kind', operator: 'eq', value: 'import_entry' }, { field: 'specialRegime.art10', operator: 'eq', value: true }, { field: 'purpose', operator: 'eq', value: 'ship_construction_repair' }, { field: 'product.rebRegisteredShip', operator: 'eq', value: true }, { field: 'customs.entryState', operator: 'eq', value: 'SC' }
  ], treatment: { importDeferral: 'full', notes: ['Não alcança uso/consumo próprio nem ativo imobilizado.'] } },
  { id: 'SC-AN3-ART10-L-FIXED-ASSET', title: 'Máquinas e equipamentos para implantação, expansão ou reativação industrial', legalBasis: 'RICMS/SC-01, Anexo 3, art. 10-L', source: 'https://legislacao.sef.sc.gov.br/legtrib_internet/html/regulamentos/icms/ricms_01_03_pas.htm', effectiveFrom: '2021-01-01', status: 'conditional', conditions: [
    { field: 'operation.kind', operator: 'eq', value: 'import_entry' }, { field: 'specialRegime.art10L', operator: 'eq', value: true }, { field: 'purpose', operator: 'eq', value: 'fixed_asset' }, { field: 'product.isMachineOrEquipment', operator: 'eq', value: true }, { field: 'importer.isIndustrial', operator: 'eq', value: true }, { field: 'project.type', operator: 'in', value: ['reactivation', 'implementation', 'expansion'] }, { field: 'project.isInSC', operator: 'eq', value: true }, { field: 'customs.entryState', operator: 'eq', value: 'SC' }
  ], treatment: { importDeferral: 'full', notes: ['Exige regime especial, projeto físico-financeiro e demais requisitos do art. 10-L.'] } },
  { id: 'SC-AN2-ART46-DRAWBACK-SUSPENSION', title: 'Isenção de ICMS no drawback integrado suspensão', legalBasis: 'RICMS/SC-01, Anexo 2, art. 46', source: 'https://legislacao.sef.sc.gov.br/html/regulamentos/icms/ricms_01_02.htm', effectiveFrom: '2011-01-01', status: 'conditional', conditions: [
    { field: 'operation.kind', operator: 'eq', value: 'import_entry' }, { field: 'drawback.mode', operator: 'eq', value: 'suspensao' }, { field: 'drawback.isIntegrated', operator: 'eq', value: true }, { field: 'drawback.beneficiaryIsImporter', operator: 'eq', value: true }, { field: 'drawback.resultExportedByImporter', operator: 'eq', value: true }, { field: 'drawback.iiAndIpiSuspended', operator: 'eq', value: true }, { field: 'drawback.productUsedOrConsumedInIndustrialization', operator: 'eq', value: true }, { field: 'customs.entryState', operator: 'eq', value: 'SC' }
  ], treatment: { importExemption: true, importDeferral: 'none', notes: ['Não se estende ao drawback modalidade isenção.', 'Não usar automaticamente em importação por conta e ordem quando beneficiário e importador não forem a mesma pessoa.'] } },
  { id: 'SC-IMPORT-NONDISCRIMINATION-INTERNAL-REDUCTION', title: 'Extensão de redução de base interna à importação por não discriminação', legalBasis: 'RICMS/SC-01, Anexo 2; COPAT 60/2022 e 105/2022', source: 'https://legislacao.sef.sc.gov.br/Consulta/Views/Publico/Copat.aspx', effectiveFrom: '2022-01-01', status: 'conditional', conditions: [
    { field: 'operation.kind', operator: 'eq', value: 'import_entry' }, { field: 'origin.countryIsPartyToNonDiscriminationAgreement', operator: 'eq', value: true }, { field: 'internalOperation.hasMatchingBaseReduction', operator: 'eq', value: true }, { field: 'internalOperation.legalConditionsSatisfied', operator: 'eq', value: true }
  ], treatment: { notes: ['A redução interna somente se estende à importação quando todas as condições do benefício interno forem satisfeitas.'] } }
];
