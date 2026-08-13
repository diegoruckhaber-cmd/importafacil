import type { RuleCondition } from './rule-engine';

export type ScCatalogEntry = {
  id: string;
  subject: 'decreto_2128' | 'ttd_409_410' | 'ttd_77' | 'special_import' | 'rate' | 'base' | 'compatibility';
  status: 'requires_lookup' | 'conditional' | 'validated';
  effectiveFrom: string;
  effectiveTo?: string;
  conditions: RuleCondition[];
  legalBasis: string;
  source: string;
  notes: string[];
};

/** Coverage controls for SC import rules. Missing catalog data never implies eligibility. */
export const SC_RULE_CATALOG: ScCatalogEntry[] = [
  {
    id: 'SC-CAT-2128-AGRO-ITEMS-62-76', subject: 'decreto_2128', status: 'requires_lookup', effectiveFrom: '2026-03-01',
    conditions: [
      { field: 'product.dec2128Item', operator: 'in', value: [62,63,64,65,66,67,68,69,70,71,72,73,74,75,76] },
      { field: 'purpose', operator: 'exists' },
    ],
    legalBasis: 'Decreto SC 1.453/2026; Decreto 2.128/2009',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1453.htm',
    notes: ['Para os itens 62 a 76, a análise depende da destinação à agricultura ou pecuária conforme redação vigente.', 'A lista NCM/descrição do Anexo Único deve ser versionada separadamente.'],
  },
  {
    id: 'SC-CAT-TTD-409-410-OTHER-PRESUMED-CREDITS', subject: 'compatibility', status: 'conditional', effectiveFrom: '2019-08-13',
    conditions: [{ field: 'beneficiary.ttd', operator: 'in', value: ['409','410'] }, { field: 'exit.otherPresumedCredit', operator: 'eq', value: true }],
    legalBasis: 'Lei 17.763/2019, art. 1º, §6º',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    notes: ['Bloquear combinação automática com outro crédito presumido até que a compatibilidade específica esteja cadastrada.'],
  },
  {
    id: 'SC-CAT-TTD-410-TTD-77', subject: 'compatibility', status: 'conditional', effectiveFrom: '2023-01-01',
    conditions: [{ field: 'beneficiary.ttd', operator: 'in', value: ['410'] }, { field: 'beneficiary.ttd77', operator: 'eq', value: true }],
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246; COPAT 19/2026',
    source: 'https://legislacao.sef.sc.gov.br/Consulta/Views/Publico/Copat.aspx',
    notes: ['A coexistência é possível em contextos específicos; destinação e tratamento da saída devem ser avaliados separadamente.'],
  },
  {
    id: 'SC-CAT-MERCOSUR-OTHER-UF-2026-2027', subject: 'ttd_409_410', status: 'conditional', effectiveFrom: '2026-06-09', effectiveTo: '2027-06-08',
    conditions: [
      { field: 'product.originMercosur', operator: 'eq', value: true },
      { field: 'customs.entryState', operator: 'neq', value: 'SC' },
      { field: 'customs.entryMode', operator: 'eq', value: 'land' },
      { field: 'customs.clearanceState', operator: 'neq', value: 'SC' },
      { field: 'beneficiary.mercosurPortSharePercent', operator: 'gte', value: 50 },
    ],
    legalBasis: 'RICMS/SC-01, art. 110-B; Lei 17.762/2019',
    source: 'https://legislacao.sef.sc.gov.br/legtrib_internet/html/regulamentos/icms/ricms_01_00.htm',
    notes: ['Percentual mínimo de 50% no período 09/06/2026 a 08/06/2027.', 'O percentual depende de importações agregadas do período e não pode ser inferido de uma única operação.'],
  },
  {
    id: 'SC-CAT-GLME-ACCOUNT-ORDER-2026', subject: 'special_import', status: 'conditional', effectiveFrom: '2026-01-27',
    conditions: [{ field: 'operation.importStructure', operator: 'eq', value: 'account_order' }],
    legalBasis: 'RICMS/SC-01, Anexo 6, art. 192; Convênio ICMS 173/24',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1386.htm',
    notes: ['Em conta e ordem, o visto da GLME segue a regra específica do art. 192. É tratamento operacional e não substitui a análise do sujeito ativo do ICMS-importação.'],
  },
];
