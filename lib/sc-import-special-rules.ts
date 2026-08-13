import type { RuleCondition } from './rule-engine';

export type ScSpecialImportRule = {
  id: string;
  title: string;
  legalBasis: string;
  source: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'validated' | 'conditional' | 'requires_lookup';
  conditions: RuleCondition[];
  treatment: { icmsImport: 'exempt' | 'reduced' | 'deferred'; effectiveRate?: number; requiresFiscalAuthorization?: boolean };
  notes: string[];
};

/** Non-TTD special import treatments that can materially change SC ICMS. */
export const SC_SPECIAL_IMPORT_RULES_2026: ScSpecialImportRule[] = [
  {
    id: 'SC-IMP-EXEMPT-ALADI-FRESH-FRUIT',
    title: 'Importação de frutas frescas de países ALADI',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 3º, I',
    source: 'https://legislacao.sef.sc.gov.br/html/regulamentos/icms/ricms_01_02.htm',
    effectiveFrom: '2001-09-01',
    status: 'conditional',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'origin.isAladiMember', operator: 'eq', value: true },
      { field: 'product.isFreshFruit', operator: 'eq', value: true },
      { field: 'product.ncmExcludedFromAladiFruit', operator: 'eq', value: false },
    ],
    treatment: { icmsImport: 'exempt' },
    notes: ['A exclusão de amêndoa, avelã, castanha, maçã, noz e pera deve ser validada por NCM/descrição.'],
  },
  {
    id: 'SC-IMP-EXEMPT-BREEDING-STOCK',
    title: 'Importação de matriz ou reprodutor de determinadas espécies',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 3º, II',
    source: 'https://legislacao.sef.sc.gov.br/html/regulamentos/icms/ricms_01_02.htm',
    effectiveFrom: '2001-09-01',
    status: 'conditional',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'product.isRegisteredBreedingAnimal', operator: 'eq', value: true },
      { field: 'destination.isCommercialOrProducerEstablishment', operator: 'eq', value: true },
    ],
    treatment: { icmsImport: 'exempt' },
    notes: ['Exige condição de registro genealógico oficial e demais requisitos do dispositivo.'],
  },
  {
    id: 'SC-IMP-EXEMPT-DRAWBACK-SUSPENSION',
    title: 'Drawback integrado suspensão com exportação do produto resultante',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 46; Convênio ICMS 27/90',
    source: 'https://legislacao.sef.sc.gov.br/html/regulamentos/icms/ricms_01_02.htm',
    effectiveFrom: '2017-08-29',
    status: 'conditional',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'customs.regime', operator: 'eq', value: 'drawback_integrado_suspensao' },
      { field: 'product.isEmployedOrConsumedInIndustrialization', operator: 'eq', value: true },
      { field: 'federalImportTax.isSuspended', operator: 'eq', value: true },
      { field: 'federalIpi.isSuspended', operator: 'eq', value: true },
      { field: 'result.willBeExportedByImporter', operator: 'eq', value: true },
    ],
    treatment: { icmsImport: 'exempt' },
    notes: ['A isenção não se aplica a combustíveis nem energia elétrica/térmica.', 'A saída/retorno para industrialização por conta e ordem exige os requisitos do §1º.'],
  },
  {
    id: 'SC-IMP-EXEMPT-ZPE',
    title: 'Importação por estabelecimento localizado em ZPE',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 111, I',
    source: 'https://legislacao.sef.sc.gov.br/html/regulamentos/icms/ricms_01_02.htm',
    effectiveFrom: '2012-01-01',
    status: 'conditional',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'destination.isZpeEstablishment', operator: 'eq', value: true },
    ],
    treatment: { icmsImport: 'exempt' },
    notes: ['Saída posterior para o mercado interno pode descaracterizar os benefícios conforme art. 112.'],
  },
  {
    id: 'SC-IMP-REPETRO-SPED-3PCT',
    title: 'REPETRO-SPED: carga tributária equivalente a 3%',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 188-A; Convênio ICMS 3/18',
    source: 'https://legislacao.sef.sc.gov.br/html/regulamentos/icms/ricms_01_02.htm',
    effectiveFrom: '2018-04-01',
    effectiveTo: '2026-12-31',
    status: 'conditional',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'customs.regime', operator: 'eq', value: 'repetro_sped' },
      { field: 'product.isPermanentOilGasEquipment', operator: 'eq', value: true },
      { field: 'product.isAppliedToExplorationProduction', operator: 'eq', value: true },
    ],
    treatment: { icmsImport: 'reduced', effectiveRate: 3 },
    notes: ['O enquadramento depende do regime aduaneiro especial e das normas federais específicas. Vigência precisa ser revalidada quando houver nova prorrogação/alteração.'],
  },
  {
    id: 'SC-IMP-EXEMPT-PUBLIC-ADMIN-NO-SIMILAR',
    title: 'Importação por órgão público estadual de bem sem similar nacional',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 3º, XII; Convênio ICMS 48/93',
    source: 'https://legislacao.sef.sc.gov.br/html/regulamentos/icms/ricms_01_02.htm',
    effectiveFrom: '2001-09-01',
    status: 'conditional',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'importer.isStatePublicAdministration', operator: 'eq', value: true },
      { field: 'product.hasNoNationalSimilar', operator: 'eq', value: true },
      { field: 'destination.useOrPermanentAssetOfImporter', operator: 'eq', value: true },
    ],
    treatment: { icmsImport: 'exempt' },
    notes: ['Exige comprovação de inexistência de similar nacional nos termos do dispositivo.'],
  },
  {
    id: 'SC-IMP-EXEMPT-RESEARCH',
    title: 'Importações para pesquisa/ensino por entidades habilitadas',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 3º, X e correlatos; Convênios ICMS aplicáveis',
    source: 'https://legislacao.sef.sc.gov.br/html/regulamentos/icms/ricms_01_02.htm',
    effectiveFrom: '2001-09-01',
    status: 'requires_lookup',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'importer.isEligibleResearchOrHealthEntity', operator: 'eq', value: true },
      { field: 'purpose.isResearchTeachingOrHospitalService', operator: 'eq', value: true },
      { field: 'product.hasNoNationalSimilar', operator: 'eq', value: true },
    ],
    treatment: { icmsImport: 'exempt', requiresFiscalAuthorization: true },
    notes: ['Exige análise do convênio, produto, entidade e documentação; não deve ser aplicado automaticamente apenas por finalidade declarada.'],
  },
];
