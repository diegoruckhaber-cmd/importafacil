import type { RuleCondition } from './rule-engine';

export type ScBeneficiaryControl = {
  id: string;
  status: 'validated' | 'conditional' | 'requires_lookup';
  effectiveFrom: string;
  effectiveTo?: string;
  conditions: RuleCondition[];
  legalBasis: string;
  source: string;
  blocking: boolean;
  notes: string[];
};

/**
 * Controls that belong to the beneficiary/period, rather than to a single item.
 * These controls deliberately block automatic benefit application when the
 * required evidence is unavailable.
 */
export const SC_BENEFICIARY_CONTROLS: ScBeneficiaryControl[] = [
  {
    id: 'SC-BEN-CREDIT-PRESUMED-DEBT-COMPLIANCE-2026',
    status: 'validated',
    effectiveFrom: '2026-02-12',
    conditions: [
      { field: 'beneficiary.hasStateDebt', operator: 'eq', value: false },
      { field: 'beneficiary.isCurrentWithRequiredObligations', operator: 'eq', value: true },
    ],
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 25-B; Decreto SC 1.416/2026',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1416.htm',
    blocking: true,
    notes: [
      'A fruição de crédito presumido fica vedada quando houver débito com a Fazenda estadual ou descumprimento das obrigações previstas na legislação.',
      'A ausência de comprovação não deve ser tratada como inexistência de débito; deve resultar em condição pendente.',
    ],
  },
  {
    id: 'SC-BEN-TTD-NEW-BENEFICIARY-280M-2026',
    status: 'conditional',
    effectiveFrom: '2026-03-19',
    conditions: [
      { field: 'beneficiary.isNewTtdBeneficiary', operator: 'eq', value: true },
      { field: 'beneficiary.annualSubsequentImportedGoodsSales', operator: 'gte', value: 280000000 },
    ],
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246, §3º, I; Decreto SC 1.417/2026',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1417.htm',
    blocking: true,
    notes: [
      'O limite anual deve ser avaliado com dados agregados do beneficiário; não pode ser inferido de uma única importação.',
      'A regra deve ser aplicada somente quando o enquadramento como novo beneficiário e as demais condições do art. 246 estiverem confirmados.',
    ],
  },
  {
    id: 'SC-BEN-AGRO-IMPORT-APURACAO-2026',
    status: 'conditional',
    effectiveFrom: '2026-03-01',
    conditions: [
      { field: 'product.isAgriculturalInput', operator: 'eq', value: true },
      { field: 'product.importedNcm', operator: 'exists' },
    ],
    legalBasis: 'RICMS/SC-01, art. 53, §26; Decreto SC 1.427/2026',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1427.htm',
    blocking: false,
    notes: [
      'A aplicação depende do enquadramento da mercadoria nas NCMs e demais requisitos do dispositivo.',
      'A lista de NCMs deve permanecer versionada fora do cálculo matemático.',
    ],
  },
];
