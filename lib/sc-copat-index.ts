export type ScCopatImpact = 'importation' | 'post_import' | 'compatibility' | 'administrative';

export type ScCopatRecord = {
  id: string;
  year: number;
  title: string;
  impact: ScCopatImpact[];
  appliesOnlyToFacts: boolean;
  implementationStatus: 'indexed' | 'rule_required' | 'review_required';
  source: string;
  notes: string;
};

/**
 * Official SC COPAT decisions relevant to the import-cost engine.
 * COPAT answers are indexed as interpretative evidence, never as universal
 * legislation. A production rule must still identify the legal conditions and
 * facts to which the answer applies.
 */
export const SC_COPAT_INDEX_2026: ScCopatRecord[] = [
  {
    id: 'COPAT-010-2026', year: 2026,
    title: 'TTD 409/410; bobinas de aço; corte e rebobinamento',
    impact: ['importation', 'post_import', 'compatibility'],
    appliesOnlyToFacts: true, implementationStatus: 'rule_required',
    source: 'SEF/SC – COPAT 010/2026',
    notes: 'Mesma posição NCM: não impede crédito presumido; mudança de posição pode impedir o benefício. Corte sem transformação substancial não é, por si, industrialização.'
  },
  {
    id: 'COPAT-019-2026', year: 2026,
    title: 'TTD 410 e TTD 77; destinações distintas',
    impact: ['importation', 'post_import', 'compatibility'],
    appliesOnlyToFacts: true, implementationStatus: 'rule_required',
    source: 'SEF/SC – COPAT 019/2026',
    notes: 'Separar tratamento da importação, crédito presumido e destinação dos itens; não aplicar o mesmo efeito a toda a operação por padrão.'
  },
  {
    id: 'COPAT-025-2026', year: 2026,
    title: 'Paraguai/Mercosul; TTD 409; entrada e desembaraço em outra UF',
    impact: ['importation', 'post_import', 'administrative'],
    appliesOnlyToFacts: true, implementationStatus: 'rule_required',
    source: 'SEF/SC – COPAT 025/2026',
    notes: 'Sujeito ativo, entrada terrestre, venda subsequente e condições do regime devem ser avaliados em conjunto.'
  },
  {
    id: 'COPAT-026-2026', year: 2026,
    title: 'Bicarbonato de sódio; insumo agropecuário',
    impact: ['importation', 'compatibility'],
    appliesOnlyToFacts: true, implementationStatus: 'rule_required',
    source: 'SEF/SC – COPAT 026/2026',
    notes: 'Finalidade, registro no MAPA, origem GATT/OMC e tratamento do similar nacional são condições relevantes.'
  },
  {
    id: 'COPAT-029-2026', year: 2026,
    title: 'TTD 409/410; pneumáticos, câmaras, rodas e transportadoras',
    impact: ['post_import', 'compatibility'],
    appliesOnlyToFacts: true, implementationStatus: 'rule_required',
    source: 'SEF/SC – COPAT 029/2026',
    notes: 'Diferimento parcial dos §§ 23 e 24 do art. 246 não é restrito ao TTD 410; utilização pelo destinatário influencia o crédito.'
  },
  {
    id: 'COPAT-030-2026', year: 2026,
    title: 'Art. 90 do Anexo 2; compatibilidade de benefícios',
    impact: ['post_import', 'compatibility'],
    appliesOnlyToFacts: true, implementationStatus: 'rule_required',
    source: 'SEF/SC – COPAT 030/2026',
    notes: 'A vedação do art. 90 deve ser analisada em relação ao benefício aplicado na aquisição/entrada; não tratar como vedação genérica.'
  },
];

export function copatRequiresFactSpecificReview(record: ScCopatRecord): boolean {
  return record.appliesOnlyToFacts && record.implementationStatus !== 'indexed';
}
