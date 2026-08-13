export type ScImportRuleFamily =
  | 'incidence'
  | 'import_exemption'
  | 'import_deferral'
  | 'special_regime'
  | 'presumed_credit'
  | 'base_reduction'
  | 'compatibility'
  | 'restriction'
  | 'administrative_condition'
  | 'post_import_effect';

export type ScImportScopeEntry = {
  id: string;
  family: ScImportRuleFamily;
  legalReferences: string[];
  requiresProductCatalog: boolean;
  requiresBeneficiaryData: boolean;
  requiresPeriodData: boolean;
  requiresConcessionAct: boolean;
  status: 'mapped' | 'needs_rule_detail' | 'catalog_required';
  notes: string[];
};

/**
 * Scope ledger for Santa Catarina import taxation. This is deliberately a
 * coverage ledger, not a shortcut to eligibility: every family must be
 * converted into versioned rules before the SC release gate can open.
 */
export const SC_IMPORT_SCOPE: ScImportScopeEntry[] = [
  {
    id: 'SC-INCIDENCE-IMPORT', family: 'incidence',
    legalReferences: ['Lei 10.297/1996', 'RICMS/SC art. 1-3', 'RICMS/SC art. 9'],
    requiresProductCatalog: false, requiresBeneficiaryData: false, requiresPeriodData: false, requiresConcessionAct: false,
    status: 'mapped', notes: ['Fato gerador na entrada de mercadoria importada e momento do desembaraço devem permanecer separados da etapa posterior.'],
  },
  {
    id: 'SC-EXEMPTIONS-ANNEX2-ART3', family: 'import_exemption',
    legalReferences: ['RICMS/SC Anexo 2 art. 3'],
    requiresProductCatalog: true, requiresBeneficiaryData: true, requiresPeriodData: true, requiresConcessionAct: true,
    status: 'catalog_required', notes: ['Mapear todos os incisos vigentes e suas listas do Anexo 1, NCM, destinatário, finalidade, similaridade, autorização e vigência.'],
  },
  {
    id: 'SC-RETURN-SAMPLES-BAGGAGE', family: 'import_exemption',
    legalReferences: ['RICMS/SC Anexo 2 art. 4'],
    requiresProductCatalog: false, requiresBeneficiaryData: true, requiresPeriodData: false, requiresConcessionAct: false,
    status: 'mapped', notes: ['Inclui retorno de exportação, reposição de mercadoria defeituosa, amostras sem valor comercial, medicamentos para pessoa física e bagagem, quando aplicáveis.'],
  },
  {
    id: 'SC-GENERAL-IMPORT-DEFERRAL', family: 'import_deferral',
    legalReferences: ['RICMS/SC Anexo 3 art. 10'],
    requiresProductCatalog: true, requiresBeneficiaryData: true, requiresPeriodData: false, requiresConcessionAct: true,
    status: 'needs_rule_detail', notes: ['Abrange insumos agropecuários, matéria-prima/intermediário/secundário, comercialização, item específico 8543.89.90 e insumos/equipamentos para embarcações REB. Regime especial e exceções precisam ser modelados.'],
  },
  {
    id: 'SC-REPORTO', family: 'special_regime',
    legalReferences: ['RICMS/SC Anexo 2 art. 3 XL', 'RICMS/SC Anexo 3 art. 10-D'],
    requiresProductCatalog: true, requiresBeneficiaryData: true, requiresPeriodData: false, requiresConcessionAct: true,
    status: 'needs_rule_detail', notes: ['Importação para utilização exclusiva em porto catarinense, com condições de ativo, desoneração federal e similaridade.'],
  },
  {
    id: 'SC-DRAWBACK-INTEGRATED-SUSPENSION', family: 'special_regime',
    legalReferences: ['RICMS/SC Anexo 2 art. 46-47'],
    requiresProductCatalog: false, requiresBeneficiaryData: true, requiresPeriodData: false, requiresConcessionAct: true,
    status: 'needs_rule_detail', notes: ['Exige regime aduaneiro, suspensão federal, emprego/consumo no processo e exportação efetiva; manter rastreabilidade documental.'],
  },
  {
    id: 'SC-ZPE', family: 'special_regime',
    legalReferences: ['RICMS/SC Anexo 2 art. 111-112'],
    requiresProductCatalog: false, requiresBeneficiaryData: true, requiresPeriodData: false, requiresConcessionAct: true,
    status: 'needs_rule_detail', notes: ['Entrada em ZPE e perda/descaracterização do benefício na saída para mercado interno.'],
  },
  {
    id: 'SC-REPETRO-IMPORT', family: 'special_regime',
    legalReferences: ['RICMS/SC Anexo 2 arts. 179-188-E'],
    requiresProductCatalog: true, requiresBeneficiaryData: true, requiresPeriodData: true, requiresConcessionAct: true,
    status: 'catalog_required', notes: ['Separar REPETRO, REPETRO-SPED e modalidades correlatas; NCM/listas federais, utilização econômica, suspensão, redução e crédito precisam ser versionados.'],
  },
  {
    id: 'SC-TTD-409-410', family: 'presumed_credit',
    legalReferences: ['Lei 17.763/2019', 'RICMS/SC Anexo 2 art. 246', 'COPAT 010/2026', 'COPAT 019/2026', 'COPAT 025/2026', 'COPAT 029/2026'],
    requiresProductCatalog: true, requiresBeneficiaryData: true, requiresPeriodData: true, requiresConcessionAct: true,
    status: 'needs_rule_detail', notes: ['Não reduzir a regra a uma alíquota. Modelar diferimento, crédito presumido, saídas, destinação, NCM/Decreto 2.128, transferências, limites, fundos, vigência e compatibilidades.'],
  },
  {
    id: 'SC-DEC2128', family: 'restriction',
    legalReferences: ['Decreto SC 2.128/2009', 'Decreto SC 1.453/2026'],
    requiresProductCatalog: true, requiresBeneficiaryData: false, requiresPeriodData: false, requiresConcessionAct: false,
    status: 'catalog_required', notes: ['Lista do Anexo Único deve ser versionada por NCM/descrição. Itens 62-76 têm condição adicional de destinação à agricultura/pecuária desde 01/03/2026.'],
  },
  {
    id: 'SC-MERCOSUR-110B', family: 'administrative_condition',
    legalReferences: ['RICMS/SC art. 110-B', 'Decreto SC 1.551/2026'],
    requiresProductCatalog: true, requiresBeneficiaryData: true, requiresPeriodData: true, requiresConcessionAct: true,
    status: 'needs_rule_detail', notes: ['Para 09/06/2026-08/06/2027, percentual agregado mínimo de 50%; lista de exceções do Anexo 1 deve ser versionada.'],
  },
  {
    id: 'SC-ACCOUNT-ORDER-GLME', family: 'administrative_condition',
    legalReferences: ['RICMS/SC Anexo 6 art. 192', 'Decreto SC 1.386/2026'],
    requiresProductCatalog: false, requiresBeneficiaryData: true, requiresPeriodData: false, requiresConcessionAct: false,
    status: 'mapped', notes: ['A regra operacional da GLME não substitui a determinação do sujeito ativo nem a análise do benefício tributário.'],
  },
  {
    id: 'SC-POST-IMPORT-COMPATIBILITY', family: 'post_import_effect',
    legalReferences: ['RICMS/SC Anexo 2 art. 246', 'RICMS/SC Anexo 3 arts. 1 e 10'],
    requiresProductCatalog: true, requiresBeneficiaryData: true, requiresPeriodData: true, requiresConcessionAct: true,
    status: 'needs_rule_detail', notes: ['Modelar saída subsequente, transferência, industrialização, encerramento de diferimento, créditos e incompatibilidades sem assumir que o benefício da entrada resolve a tributação posterior.'],
  },
];
