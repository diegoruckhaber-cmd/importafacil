export type SCStatus = 'implemented' | 'conditional' | 'catalog_required' | 'legal_review';

export type SCRuleFamily = {
  id: string;
  source: string;
  subject: string;
  status: SCStatus;
  requiredContext: string[];
  effects: string[];
  notes: string;
};

/**
 * Coverage map for Santa Catarina import scenarios. This is deliberately a
 * rule-family registry, not a substitute for the legal text or NCM catalogs.
 * A family cannot be treated as production-ready until its conditions and
 * required catalogs are resolved.
 */
export const SC_IMPORT_RULE_FAMILIES: SCRuleFamily[] = [
  {
    id: 'sc-ttd-409-410-import',
    source: 'RICMS/SC Anexo 2 art. 246',
    subject: 'TTD 409/410: diferimento na importação',
    status: 'conditional',
    requiredContext: ['beneficiaryAct', 'operationDate', 'destination', 'goods', 'purpose'],
    effects: ['deferICMSImport'],
    notes: 'Import treatment must be evaluated separately from the subsequent presumptive credit.'
  },
  {
    id: 'sc-ttd-409-410-output',
    source: 'RICMS/SC Anexo 2 art. 246',
    subject: 'TTD 409/410: crédito presumido na saída',
    status: 'conditional',
    requiredContext: ['beneficiaryAct', 'operationDate', 'goods', 'destination', 'outputPurpose'],
    effects: ['presumptiveCredit'],
    notes: 'Output eligibility is not inferred solely from import eligibility.'
  },
  {
    id: 'sc-ttd-77',
    source: 'RICMS/SC Anexo 3 art. 10',
    subject: 'TTD 77: importação para industrialização',
    status: 'conditional',
    requiredContext: ['beneficiaryAct', 'operationDate', 'goods', 'industrializationInSC'],
    effects: ['deferICMSImport'],
    notes: 'Must be resolved independently from TTD 409/410 and according to destination of each item.'
  },
  {
    id: 'sc-decree-2128',
    source: 'Decreto 2.128/2009',
    subject: 'Mercadorias excluídas de tratamentos tributários diferenciados',
    status: 'catalog_required',
    requiredContext: ['ncm', 'goodsDescription', 'purpose', 'operationDate'],
    effects: ['blockOrLimitBenefit'],
    notes: 'Requires versioned Annex Único catalog and contextual exceptions.'
  },
  {
    id: 'sc-110b',
    source: 'RICMS/SC art. 110-B',
    subject: 'Condição agregada para importações abrangidas',
    status: 'conditional',
    requiredContext: ['periodImports', 'operationDate', 'ncm', 'entryAndClearanceLocation', 'origin'],
    effects: ['validateAggregatedThreshold'],
    notes: 'Cannot be decided from the current operation alone.'
  },
  {
    id: 'sc-import-exemptions-annex2',
    source: 'RICMS/SC Anexo 2 art. 3',
    subject: 'Isenções na importação',
    status: 'catalog_required',
    requiredContext: ['ncm', 'beneficiaryType', 'purpose', 'documentation', 'operationDate'],
    effects: ['exemptICMSImport'],
    notes: 'Several hypotheses depend on lists, beneficiary and documentary conditions.'
  },
  {
    id: 'sc-import-deferrals-annex3',
    source: 'RICMS/SC Anexo 3',
    subject: 'Diferimentos específicos de importação',
    status: 'conditional',
    requiredContext: ['ncm', 'purpose', 'beneficiaryAct', 'operationDate'],
    effects: ['deferICMSImport'],
    notes: 'Keep distinct from presumptive-credit rules.'
  },
  {
    id: 'sc-special-regimes',
    source: 'RICMS/SC Anexos 2/3',
    subject: 'REPORTO, REPETRO/SPED, ZPE, Drawback e regimes especiais',
    status: 'catalog_required',
    requiredContext: ['regime', 'goods', 'purpose', 'authorization', 'operationDate'],
    effects: ['applySpecialTreatment'],
    notes: 'Each regime requires its own eligibility and documentation model.'
  },
  {
    id: 'sc-copat-interpretations',
    source: 'COPAT 010/26, 019/26, 025/26, 029/26 e correlatas',
    subject: 'Interpretações administrativas contextualizadas',
    status: 'conditional',
    requiredContext: ['facts', 'ncm', 'purpose', 'operationDate'],
    effects: ['interpretEligibility'],
    notes: 'COPAT evidence is scoped to its factual/legal context and is not a blanket rule.'
  }
];

export function getBlockingSCFamilies(): SCRuleFamily[] {
  return SC_IMPORT_RULE_FAMILIES.filter(rule => rule.status !== 'implemented');
}

export function isSCFamilyCoverageComplete(): boolean {
  return getBlockingSCFamilies().length === 0;
}
