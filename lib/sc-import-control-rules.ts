export type ScImportControl = {
  id: string;
  family: 'credit_presumed' | 'deferral' | 'exemption' | 'special_regime' | 'compatibility' | 'period_control';
  legalReferences: string[];
  effectiveFrom: string;
  effectiveTo?: string;
  requiredInputs: string[];
  effect: 'tax_reduction' | 'tax_deferral' | 'eligibility_gate' | 'post_import_reversal';
  confidence: 'validated_source' | 'requires_catalog' | 'requires_concession_act';
  notes: string[];
};

/**
 * High-risk SC controls that must be evaluated before a simulation can be
 * marked as production-grade. These are deliberately explicit: the engine
 * must not infer eligibility from a TTD number alone.
 */
export const SC_IMPORT_CONTROLS: ScImportControl[] = [
  {
    id: 'SC-CREDIT-PRESUMED-DEBT-COMPLIANCE',
    family: 'credit_presumed',
    legalReferences: ['RICMS/SC Anexo 2 art. 25-B', 'Decreto 1.416/2026', 'Portaria SEF 130/2026'],
    effectiveFrom: '2026-04-01',
    requiredInputs: ['stateTaxDebtStatus', 'requiredObligationCompliance', 'dcipCode'],
    effect: 'eligibility_gate', confidence: 'requires_catalog',
    notes: ['A vedação ao crédito presumido possui exceções por código DCIP; o catálogo da Portaria SEF 130/2026 deve ser versionado.'],
  },
  {
    id: 'SC-TTD-410-POST-IMPORT',
    family: 'credit_presumed',
    legalReferences: ['RICMS/SC Anexo 2 art. 246'],
    effectiveFrom: '2026-01-01',
    requiredInputs: ['concessionAct', 'importPurpose', 'entryCustomsLocation', 'subsequentOperationType', 'productCatalog'],
    effect: 'tax_reduction', confidence: 'requires_concession_act',
    notes: ['O regime tem duas etapas: diferimento no desembaraço e crédito presumido na saída subsequente. A carga deve ser determinada pelo ato e pelas condições vigentes.'],
  },
  {
    id: 'SC-TTD-77-INDUSTRIALIZATION',
    family: 'deferral',
    legalReferences: ['RICMS/SC Anexo 3 art. 10 II'],
    effectiveFrom: '2026-01-01',
    requiredInputs: ['concessionAct', 'importPurpose', 'industrializationLocation', 'productCatalog'],
    effect: 'tax_deferral', confidence: 'requires_concession_act',
    notes: ['Diferenciar matéria-prima/material intermediário/secundário destinado à industrialização de mercadoria destinada à comercialização.'],
  },
  {
    id: 'SC-MERCOSUR-PERCENTAGE-2026-2027',
    family: 'period_control',
    legalReferences: ['RICMS/SC art. 110-B', 'Decreto 1.551/2026'],
    effectiveFrom: '2026-06-09', effectiveTo: '2027-06-08',
    requiredInputs: ['periodImportCustomsValue', 'eligibleImportCustomsValue', 'entryInOtherState', 'originCountry', 'productCatalog'],
    effect: 'eligibility_gate', confidence: 'requires_catalog',
    notes: ['O percentual é agregado no período e o descumprimento pode gerar pagamento integral e estornos; não pode ser avaliado por uma única operação isolada.'],
  },
  {
    id: 'SC-IMPORT-EXEMPTION-ANNEX2-ART3',
    family: 'exemption',
    legalReferences: ['RICMS/SC Anexo 2 art. 3'],
    effectiveFrom: '2026-01-01',
    requiredInputs: ['ncm', 'productDescription', 'beneficiaryType', 'purpose', 'authorization', 'similarityRequirement', 'productCatalog'],
    effect: 'tax_reduction', confidence: 'requires_catalog',
    notes: ['Cada inciso deve ser avaliado individualmente; não presumir isenção por descrição genérica.'],
  },
  {
    id: 'SC-GENERAL-IMPORT-DEFERRAL-ANNEX3-ART10',
    family: 'deferral',
    legalReferences: ['RICMS/SC Anexo 3 art. 10'],
    effectiveFrom: '2026-01-01',
    requiredInputs: ['ncm', 'importPurpose', 'beneficiaryType', 'concessionAct', 'productCatalog'],
    effect: 'tax_deferral', confidence: 'requires_catalog',
    notes: ['As hipóteses do art. 10 têm subitens e condições próprias; o catálogo deve ser granular por mercadoria e finalidade.'],
  },
  {
    id: 'SC-POST-IMPORT-DIFFERENT-PURPOSES',
    family: 'compatibility',
    legalReferences: ['COPAT 19/2026', 'RICMS/SC Anexo 2 art. 246', 'RICMS/SC Anexo 3 art. 10'],
    effectiveFrom: '2026-01-01',
    requiredInputs: ['itemPurposeByLine', 'tdsByLine', 'subsequentOperationTypeByLine'],
    effect: 'eligibility_gate', confidence: 'validated_source',
    notes: ['Uma mesma importação pode exigir tratamentos distintos por item/destinação; não aplicar automaticamente o tratamento da operação inteira.'],
  },
];
