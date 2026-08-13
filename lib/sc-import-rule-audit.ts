export type ScRuleStatus = 'covered' | 'conditional' | 'catalog_required' | 'legal_review';

export type ScRuleAudit = {
  id: string;
  family: string;
  status: ScRuleStatus;
  requiresNcmCatalog: boolean;
  requiresBeneficiaryData: boolean;
  requiresPeriodData: boolean;
  requiresConcessionAct: boolean;
  requiresDocumentaryEvidence: boolean;
  source: string;
  notes: string;
};

/**
 * Final-audit checklist for Santa Catarina import simulations.
 * This is intentionally a coverage matrix, not a tax calculation.
 * A family cannot be promoted to production merely because its legal text
 * was located; all dependencies required for a computable decision must be
 * explicitly accounted for.
 */
export const SC_IMPORT_RULE_AUDIT: ScRuleAudit[] = [
  {
    id: 'sc-icms-import-base',
    family: 'ICMS importação / base e cálculo por dentro',
    status: 'covered',
    requiresNcmCatalog: false,
    requiresBeneficiaryData: false,
    requiresPeriodData: false,
    requiresConcessionAct: false,
    requiresDocumentaryEvidence: false,
    source: 'Lei 10.297/1996; RICMS/SC',
    notes: 'Base, alíquota e mecânica do imposto devem permanecer independentes dos benefícios.'
  },
  {
    id: 'sc-ttd-409-410',
    family: 'TTD 409/410',
    status: 'conditional',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: true,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC Anexo 2 art. 246; atos concessivos; COPAT',
    notes: 'Separar diferimento da importação e crédito presumido da saída subsequente.'
  },
  {
    id: 'sc-ttd-77',
    family: 'TTD 77 / industrialização',
    status: 'conditional',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: false,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC Anexo 3 art. 10; COPAT 19/2026',
    notes: 'Finalidade industrial precisa ser tratada por item.'
  },
  {
    id: 'sc-110b-mercosul',
    family: 'Art. 110-B / MERCOSUL',
    status: 'catalog_required',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: true,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC art. 110-B; Alterações 4.988/4.989',
    notes: 'Percentual mínimo é agregado no período e há lista de exceções no Anexo 1.'
  },
  {
    id: 'sc-decreto-2128',
    family: 'Decreto 2.128/2009',
    status: 'catalog_required',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: false,
    requiresPeriodData: false,
    requiresConcessionAct: false,
    requiresDocumentaryEvidence: true,
    source: 'Decreto 2.128/2009 e alterações 2026; COPAT',
    notes: 'Decisão depende de NCM, descrição e, em hipóteses atualizadas, destinação.'
  },
  {
    id: 'sc-annex2-import-exemptions',
    family: 'Isenções do Anexo 2 aplicáveis à importação',
    status: 'catalog_required',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: false,
    requiresConcessionAct: false,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC Anexo 2',
    notes: 'Cada hipótese exige condições próprias; listas do Anexo 1 devem ser versionadas.'
  },
  {
    id: 'sc-annex3-import-deferrals',
    family: 'Diferimentos do Anexo 3',
    status: 'conditional',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: false,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC Anexo 3',
    notes: 'Diferimento não deve ser confundido com redução ou crédito presumido.'
  },
  {
    id: 'sc-special-regimes',
    family: 'REPORTO / REPETRO-SPED / ZPE / Drawback',
    status: 'conditional',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: false,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC e convênios aplicáveis',
    notes: 'Cada regime terá módulo próprio de elegibilidade e documentação.'
  },
  {
    id: 'sc-credit-presumptions',
    family: 'Créditos presumidos relacionados à operação',
    status: 'conditional',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: true,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC Anexo 2; Portaria SEF 130/2026',
    notes: 'Aplicar primeiro a vedação do art. 25-B e depois as exceções catalogadas.'
  }
];

export function scImportAuditHasBlockingGaps(): boolean {
  return SC_IMPORT_RULE_AUDIT.some(rule => rule.status !== 'covered');
}
