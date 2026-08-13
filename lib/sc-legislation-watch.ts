export type ScLegislationWatchEntry = {
  act: string;
  publishedAt: string;
  effectiveFrom?: string;
  relevance: 'import_tax' | 'benefit_eligibility' | 'administrative' | 'not_in_import_scope';
  status: 'incorporated' | 'screened_no_import_impact' | 'requires_review';
  source: string;
  notes: string;
};

/**
 * Release-gate ledger for SC legislative changes. Every new 2026 decree is
 * screened before the SC ruleset can be declared complete.
 */
export const SC_2026_LEGISLATION_WATCH: ScLegislationWatchEntry[] = [
  {
    act: 'Decreto 1.416/2026', publishedAt: '2026-02-12', relevance: 'benefit_eligibility', status: 'incorporated',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1416.htm',
    notes: 'Vedação à fruição de crédito presumido por débito estadual ou descumprimento de obrigações; suspensão de TTD prevista nas hipóteses legais.',
  },
  {
    act: 'Decreto 1.417/2026', publishedAt: '2026-02-12', effectiveFrom: '2026-03-19', relevance: 'benefit_eligibility', status: 'incorporated',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1417.htm',
    notes: 'Alteração do requisito anual de R$ 280 milhões do art. 246.',
  },
  {
    act: 'Decreto 1.427/2026', publishedAt: '2026-02-27', effectiveFrom: '2026-03-01', relevance: 'import_tax', status: 'incorporated',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1427.htm',
    notes: 'Tratamento específico para apuração do ICMS na entrada de determinados insumos agropecuários importados.',
  },
  {
    act: 'Decreto 1.453/2026', publishedAt: '2026-03-18', effectiveFrom: '2026-03-01', relevance: 'benefit_eligibility', status: 'incorporated',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1453.htm',
    notes: 'Exceção no Decreto 2.128/2009 para itens 62 a 76 quando destinados à agricultura ou pecuária.',
  },
  {
    act: 'Decreto 1.477/2026', publishedAt: '2026-04-10', relevance: 'benefit_eligibility', status: 'incorporated',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1477.htm',
    notes: 'Regulamenta hipóteses de não exigência de crédito por descumprimento de condicionantes econômicas/financeiras; não deve ser confundido com elegibilidade automática de novos benefícios.',
  },
  {
    act: 'Decreto 1.551/2026', publishedAt: '2026-06-03', effectiveFrom: '2026-06-09', relevance: 'import_tax', status: 'incorporated',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1551.htm',
    notes: 'Art. 110-B: condição temporal de 50% para operações originárias do MERCOSUL e lista de mercadorias excluídas do tratamento.',
  },
  {
    act: 'Decreto 1.615/2026', publishedAt: '2026-07-17', effectiveFrom: '2026-06-01', relevance: 'not_in_import_scope', status: 'screened_no_import_impact',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1615.htm',
    notes: 'Alteração 4.991 trata de documentos/condições para execução de obras pela CELESC; não altera o cálculo ou a elegibilidade tributária de uma importação no escopo atual.',
  },
];
