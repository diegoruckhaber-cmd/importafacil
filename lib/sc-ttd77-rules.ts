import type { RuleCondition } from './rule-engine';

export type ScTtd77Rule = {
  id: string;
  title: string;
  legalBasis: string;
  source: string;
  effectiveFrom: string;
  status: 'validated' | 'conditional';
  conditions: RuleCondition[];
  treatment: { importDeferral: 'full' | 'none' };
  notes: string[];
};

/** TTD 77 / Anexo 3, art. 10, II: importação for industrialização in SC. */
export const SC_TTD77_RULES_2026: ScTtd77Rule[] = [
  {
    id: 'SC-TTD-77-IMPORT-RAW-MATERIAL',
    title: 'TTD 77: diferimento na importação de matéria-prima/material intermediário/material secundário',
    legalBasis: 'RICMS/SC-01, Anexo 3, art. 10, II',
    source: 'https://legislacao.sef.sc.gov.br/legtrib_internet/html/regulamentos/icms/ricms_01_03.htm',
    effectiveFrom: '2019-01-01',
    status: 'conditional',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'beneficiary.ttd', operator: 'eq', value: '77' },
      { field: 'purpose', operator: 'eq', value: 'industrialization' },
      { field: 'industrialization.state', operator: 'eq', value: 'SC' },
      { field: 'beneficiary.actValid', operator: 'eq', value: true },
    ],
    treatment: { importDeferral: 'full' },
    notes: [
      'O diferimento depende de regime/registro e das condições do tratamento vigente.',
      'A mercadoria deve ser destinada à utilização como matéria-prima, material intermediário ou material secundário em processo de industrialização em território catarinense.',
      'A regra não deve ser confundida com o TTD 409/410, que é o tratamento de importação para comercialização.',
    ],
  },
  {
    id: 'SC-TTD-77-GATT-ISENCAO-OVER-DIFERIMENTO',
    title: 'TTD 77: isenção específica pode substituir o diferimento na importação',
    legalBasis: 'RICMS/SC-01, Anexo 3, art. 10, II; Anexo 2, art. 2º, conforme hipótese',
    source: 'https://legislacao.sef.sc.gov.br/Consulta/Views/Publico/DocumentoLegalViewer.ashx?id=1F7698C9-361D-4E8B-82A7-886275769030',
    effectiveFrom: '2016-01-01',
    status: 'conditional',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'product.internalOperationIsExempt', operator: 'eq', value: true },
      { field: 'origin.isGattSignatory', operator: 'eq', value: true },
    ],
    treatment: { importDeferral: 'none' },
    notes: ['Quando a própria importação estiver abrangida pela extensão da isenção ao similar nacional e todas as condições forem atendidas, não há ICMS devido a diferir.'],
  },
  {
    id: 'SC-TTD-77-COEXISTENCE-TTD409-COMMERCIAL',
    title: 'TTD 77 + TTD 409/410: tratamento pode ser escolhido conforme destinação',
    legalBasis: 'COPAT 19/2026; COPAT 22/2023',
    source: 'https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=5E464851-4EF2-4DA5-9A38-8E8D716AAC73',
    effectiveFrom: '2026-05-08',
    status: 'validated',
    conditions: [
      { field: 'beneficiary.hasTtd410', operator: 'eq', value: true },
      { field: 'beneficiary.hasTtd77', operator: 'eq', value: true },
    ],
    treatment: { importDeferral: 'full' },
    notes: [
      'É possível desembaraçar integralmente sob o TTD 410 e utilizar o crédito presumido somente nas saídas comerciais, submetendo à tributação normal as mercadorias efetivamente destinadas à industrialização.',
      'O sistema deve impedir a troca retroativa do tratamento da importação para outro regime após o fato apenas para obter benefício diferente.',
    ],
  },
];
