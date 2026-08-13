export type ScCatalogKind =
  | 'ncm_list'
  | 'beneficiary_list'
  | 'document_requirement'
  | 'period_metric'
  | 'compatibility_matrix'
  | 'vigency';

export type ScCatalogControl = {
  id: string;
  kind: ScCatalogKind;
  legalSource: string;
  requiredFor: string[];
  status: 'open' | 'mapped' | 'validated';
  blocking: boolean;
  notes: string;
};

/**
 * Catalogs are kept separate from rule logic. A rule that references a list
 * must not silently become eligible when the list is incomplete or stale.
 */
export const SC_CATALOG_CONTROLS: ScCatalogControl[] = [
  {
    id: 'DEC-2128-ANNEX', kind: 'ncm_list',
    legalSource: 'Decreto 2.128/2009, Anexo Único, com alterações de 2026',
    requiredFor: ['DEC2128', 'TTD409-410', 'TTD77'], status: 'open', blocking: true,
    notes: 'Versionar item, NCM, descrição e condição de destinação; não inferir apenas pela NCM.'
  },
  {
    id: 'ART-110B-EXCEPTIONS', kind: 'ncm_list',
    legalSource: 'RICMS/SC art. 110-B e Decreto 1.551/2026',
    requiredFor: ['MERCOSUR-110B'], status: 'open', blocking: true,
    notes: 'Lista de exceções precisa ser vinculada à vigência do período e à operação.'
  },
  {
    id: 'AGRO-IMPORT-NCMS', kind: 'ncm_list',
    legalSource: 'Decreto 1.427/2026; Anexo 1/Anexo 2 conforme mercadoria',
    requiredFor: ['AGRO-IMPORT'], status: 'open', blocking: true,
    notes: 'NCM não basta: finalidade, registro/qualificação e origem precisam ser avaliados quando exigidos.'
  },
  {
    id: 'ANNEX2-IMPORT-EXEMPTIONS', kind: 'ncm_list',
    legalSource: 'RICMS/SC Anexo 2, art. 3 e dispositivos correlatos',
    requiredFor: ['ANNEX2-ART3', 'ANNEX2-ART4'], status: 'open', blocking: true,
    notes: 'Catalogar listas e referências externas por inciso, evitando uma lista única de “isenções”.'
  },
  {
    id: 'REPETRO-LISTS', kind: 'ncm_list',
    legalSource: 'RICMS/SC Anexo 2, arts. 179 a 188-E',
    requiredFor: ['REPETRO'], status: 'open', blocking: true,
    notes: 'Separar modalidade, equipamento, beneficiário, utilização e carga aplicável.'
  },
  {
    id: 'REPORTO-CONDITIONS', kind: 'document_requirement',
    legalSource: 'RICMS/SC; Convênios ICMS aplicáveis',
    requiredFor: ['REPORTO'], status: 'open', blocking: true,
    notes: 'Controlar habilitação, destinação, documentação e demais condições materiais.'
  },
  {
    id: 'DRAWBACK-ACT', kind: 'document_requirement',
    legalSource: 'RICMS/SC Anexo 2 arts. 46-47',
    requiredFor: ['DRAWBACK'], status: 'open', blocking: true,
    notes: 'Ato concessivo e condições de suspensão/encerramento devem ser comprováveis.'
  },
  {
    id: 'TTD-ACT', kind: 'document_requirement',
    legalSource: 'Lei 17.763/2019; RICMS/SC Anexo 2 art. 246',
    requiredFor: ['TTD409-410', 'TTD77'], status: 'open', blocking: true,
    notes: 'Registrar ato concessivo, vigência, condições particulares e eventuais DCIP.'
  },
  {
    id: 'BENEFICIARY-EXCEPTIONS', kind: 'beneficiary_list',
    legalSource: 'RICMS/SC e Portarias SEF vigentes',
    requiredFor: ['BENEFICIARY'], status: 'open', blocking: true,
    notes: 'Regularidade, exceções e reconhecimentos administrativos devem ser versionados.'
  },
  {
    id: 'PERIOD-METRICS', kind: 'period_metric',
    legalSource: 'RICMS/SC art. 110-B e art. 246',
    requiredFor: ['PERIOD-CONTROLS', 'MERCOSUR-110B', 'TTD409-410'], status: 'open', blocking: true,
    notes: 'Suportar janela temporal, soma de operações, percentuais e limites econômicos.'
  },
  {
    id: 'BENEFIT-COMPATIBILITY', kind: 'compatibility_matrix',
    legalSource: 'RICMS/SC Anexos 2/3 e Consultas COPAT',
    requiredFor: ['TTD409-410', 'TTD77', 'ANNEX2-REDUCTIONS', 'POST-IMPORT'], status: 'open', blocking: true,
    notes: 'Modelar combinações permitidas, proibidas e dependentes de destinação.'
  },
  {
    id: 'SC-VIGENCY', kind: 'vigency',
    legalSource: 'SEF/SC — decretos, portarias e atos vigentes',
    requiredFor: ['2026-ALTERATIONS', 'COPAT-2026'], status: 'open', blocking: true,
    notes: 'Toda regra/catálogo deve possuir início/fim de vigência ou estado atual explicitamente registrado.'
  },
];

export function isScCatalogReleaseReady(): boolean {
  return SC_CATALOG_CONTROLS.every(item => !item.blocking || item.status === 'validated');
}
