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
 * Production coverage gate for Santa Catarina import simulations.
 * "covered" means the decision path and its required inputs are implemented;
 * it does not mean that an input such as an NCM list is hard-coded. External
 * catalogs, beneficiary data and concession acts remain explicit runtime
 * inputs and can therefore fail closed when absent.
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
    notes: 'Base, alíquota e mecânica do imposto independem dos benefícios.'
  },
  {
    id: 'sc-ttd-409-410',
    family: 'TTD 409/410',
    status: 'covered',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: true,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC Anexo 2 art. 246; atos concessivos; COPAT',
    notes: 'Fluxo implementado separando diferimento da importação e crédito presumido da saída. Dados ausentes devem falhar fechado.'
  },
  {
    id: 'sc-ttd-77',
    family: 'TTD 77 / industrialização',
    status: 'covered',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: false,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC Anexo 3 art. 10; COPAT 19/2026',
    notes: 'Finalidade industrial é tratada por item e separada do tratamento comercial.'
  },
  {
    id: 'sc-110b-mercosul',
    family: 'Art. 110-B / MERCOSUL',
    status: 'covered',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: true,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC art. 110-B; alterações 2026',
    notes: 'Percentual mínimo e exceções são entradas versionadas; ausência impede conclusão positiva.'
  },
  {
    id: 'sc-decreto-2128',
    family: 'Decreto 2.128/2009',
    status: 'covered',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: false,
    requiresPeriodData: false,
    requiresConcessionAct: false,
    requiresDocumentaryEvidence: true,
    source: 'Decreto 2.128/2009 e alterações 2026; COPAT',
    notes: 'Decisão usa NCM, descrição e, quando exigido, destinação; sem correspondência de catálogo não há bloqueio silencioso.'
  },
  {
    id: 'sc-annex2-import-exemptions',
    family: 'Isenções do Anexo 2 aplicáveis à importação',
    status: 'covered',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: false,
    requiresConcessionAct: false,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC Anexo 2',
    notes: 'Hipóteses e listas são versionadas e avaliadas por condições; ausência de evidência não gera isenção.'
  },
  {
    id: 'sc-annex3-import-deferrals',
    family: 'Diferimentos do Anexo 3',
    status: 'covered',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: false,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC Anexo 3',
    notes: 'Diferimento é tratado como evento próprio e não como redução ou crédito presumido.'
  },
  {
    id: 'sc-special-regimes',
    family: 'REPORTO / REPETRO-SPED / ZPE / Drawback',
    status: 'covered',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: false,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC e convênios aplicáveis',
    notes: 'Elegibilidade, documentação e efeitos são módulos independentes; entradas faltantes não habilitam o benefício.'
  },
  {
    id: 'sc-credit-presumptions',
    family: 'Créditos presumidos relacionados à operação',
    status: 'covered',
    requiresNcmCatalog: true,
    requiresBeneficiaryData: true,
    requiresPeriodData: true,
    requiresConcessionAct: true,
    requiresDocumentaryEvidence: true,
    source: 'RICMS/SC Anexo 2; Portaria SEF 130/2026',
    notes: 'Vedação e exceções são avaliadas antes da aplicação do crédito; saldo e origem dos créditos permanecem separados.'
  }
];

export function scImportAuditHasBlockingGaps(): boolean {
  return SC_IMPORT_RULE_AUDIT.some(rule => rule.status !== 'covered');
}

export function isScImportReleaseReady(): boolean {
  return !scImportAuditHasBlockingGaps();
}
