import type { RuleCondition } from './rule-engine';

export type ScRuleStatus = 'validated' | 'conditional' | 'requires_lookup';

export type ScImportRule = {
  id: string;
  title: string;
  legalBasis: string;
  source: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: ScRuleStatus;
  conditions: RuleCondition[];
  treatment: {
    importDeferral?: 'full' | 'partial' | 'none';
    subsequentCreditPresumed?: boolean;
    effectiveCharge?: number;
    creditReplacement?: 'replaces_effective_credits' | 'none';
  };
  notes: string[];
};

/**
 * Santa Catarina import-ICMS rule catalog.
 *
 * This catalog deliberately stores legal treatment separately from the
 * arithmetic engine. It is not a substitute for the beneficiary's individual
 * concessive act: where eligibility depends on an act, guarantee, authorization
 * or a product list that is not safely derivable from the operation alone, the
 * rule remains conditional/requires_lookup.
 */
export const SC_IMPORT_RULES_2026: ScImportRule[] = [
  {
    id: 'SC-ICMS-IMPORT-MODAL-17',
    title: 'Alíquota interna modal na entrada de mercadoria importada',
    legalBasis: 'RICMS/SC-01, art. 26, I',
    source: 'https://legislacao.sef.sc.gov.br/legtrib_internet/html/regulamentos/icms/ricms_01_00.htm',
    effectiveFrom: '2022-07-01',
    status: 'validated',
    conditions: [{ field: 'operation.kind', operator: 'eq', value: 'import_entry' }],
    treatment: { effectiveCharge: 17 },
    notes: ['É alíquota modal; regras específicas podem conduzir a 12% ou 25%.'],
  },
  {
    id: 'SC-TTD-409-410-IMPORT-DEFERRAL',
    title: 'TTD 409/410: diferimento do ICMS da importação para comercialização',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246, caput, I e §1º',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    effectiveFrom: '2019-08-13',
    status: 'conditional',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'purpose', operator: 'eq', value: 'resale' },
      { field: 'beneficiary.actValid', operator: 'eq', value: true },
      { field: 'customs.entryState', operator: 'eq', value: 'SC' },
    ],
    treatment: { importDeferral: 'full' },
    notes: [
      'O benefício depende do regime especial/ato concessivo e de suas condições.',
      'Para MERCOSUL com entrada em outra UF, a lei admite o diferimento quando a entrada ocorrer exclusivamente por via terrestre.',
      'Para mercadoria não originária do MERCOSUL com desembaraço fora de SC, a regra exige autorização da SEF e desembaraço em SC.',
    ],
  },
  {
    id: 'SC-TTD-409-410-CP-1PCT',
    title: 'TTD 409/410: carga efetiva de 1% em operações sujeitas a 4% ou sem similar nacional',
    legalBasis: 'Lei 17.763/2019, art. 1º, II, a, item 2',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    effectiveFrom: '2020-01-01',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'exit.isSubsequentToBenefitedImport', operator: 'eq', value: true },
      { field: 'exit.rate', operator: 'eq', value: 4 },
    ],
    treatment: { subsequentCreditPresumed: true, effectiveCharge: 1, creditReplacement: 'replaces_effective_credits' },
    notes: ['A carga é aplicada sobre a base integral da operação própria.', 'O enquadramento concreto depende das demais condições do art. 246 e do ato concessivo.'],
  },
  {
    id: 'SC-TTD-409-410-CP-36PCT',
    title: 'TTD 409/410: carga efetiva de 3,6% nas demais operações',
    legalBasis: 'Lei 17.763/2019, art. 1º, II, b',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    effectiveFrom: '2019-08-13',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'exit.isSubsequentToBenefitedImport', operator: 'eq', value: true },
      { field: 'exit.rate', operator: 'in', value: [12, 17, 25] },
    ],
    treatment: { subsequentCreditPresumed: true, effectiveCharge: 3.6, creditReplacement: 'replaces_effective_credits' },
    notes: ['A utilização do crédito presumido não pode produzir carga menor que a permitida pela regra de redução de base aplicável, quando houver.', 'Há regras especiais para operações com aço, alumínio, cobre, coque e prata.'],
  },
  {
    id: 'SC-TTD-409-410-NEW-BENEFICIARY-26PCT',
    title: 'TTD 409/410: carga agravada para estabelecimento sem histórico de 36 meses',
    legalBasis: 'Lei 17.763/2019, art. 1º, §2º, I',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    effectiveFrom: '2019-08-13',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'beneficiary.has36MonthsContinuousTTD', operator: 'eq', value: false },
      { field: 'exit.rate', operator: 'eq', value: 4 },
    ],
    treatment: { subsequentCreditPresumed: true, effectiveCharge: 2.6, creditReplacement: 'replaces_effective_credits' },
    notes: ['A exceção do §3º elimina a aplicação do §2º quando cumprida a condição de volume anual de saídas ou de centro de distribuição/unidade fabril em SC.', 'Desde 19/03/2026 o limite de saídas para a exceção é R$ 280 milhões/ano.'],
  },
  {
    id: 'SC-TTD-409-410-NEW-BENEFICIARY-46PCT',
    title: 'TTD 409/410: novo beneficiário em operações de menor carga',
    legalBasis: 'Lei 17.763/2019, art. 1º, §2º, II, a',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    effectiveFrom: '2019-08-13',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'beneficiary.has36MonthsContinuousTTD', operator: 'eq', value: false },
      { field: 'exit.rate', operator: 'lt', value: 12 },
    ],
    treatment: { subsequentCreditPresumed: true, effectiveCharge: 4.6, creditReplacement: 'replaces_effective_credits' },
    notes: ['Regra deve ser refinada para distinguir operação interestadual com alíquota menor que 12% e operação interna com redução de base que resulte em tributação inferior a 12%.'],
  },
  {
    id: 'SC-TTD-409-410-NEW-BENEFICIARY-76PCT',
    title: 'TTD 409/410: novo beneficiário nas demais operações',
    legalBasis: 'Lei 17.763/2019, art. 1º, §2º, II, b',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    effectiveFrom: '2019-08-13',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'beneficiary.has36MonthsContinuousTTD', operator: 'eq', value: false },
      { field: 'exit.rate', operator: 'in', value: [12, 17, 25] },
    ],
    treatment: { subsequentCreditPresumed: true, effectiveCharge: 7.6, creditReplacement: 'replaces_effective_credits' },
    notes: ['Não se aplica quando a exceção do §3º estiver satisfeita.'],
  },
  {
    id: 'SC-TTD-409-410-NO-CP-INDUSTRIALIZATION',
    title: 'TTD 409/410: saída de produto industrializado',
    legalBasis: 'Lei 17.763/2019, art. 1º, §6º, II, a',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    effectiveFrom: '2019-08-13',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'exit.resultIsIndustrializedProduct', operator: 'eq', value: true },
    ],
    treatment: { subsequentCreditPresumed: false },
    notes: ['Exceção somente se industrialização ocorrer em SC, não alterar características originais e produto permanecer na mesma posição NCM. Industrialização fora de SC impede o crédito presumido.'],
  },
  {
    id: 'SC-TTD-409-410-NO-INTERNAL-TRANSFER',
    title: 'TTD 409/410: transferência interna para estabelecimento do mesmo titular',
    legalBasis: 'Lei 17.763/2019, art. 1º, §6º, II, b',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    effectiveFrom: '2019-08-13',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'exit.transfer.sameTitular', operator: 'eq', value: true },
      { field: 'exit.destinationState', operator: 'eq', value: 'SC' },
    ],
    treatment: { subsequentCreditPresumed: false },
    notes: ['Transferência para outro estabelecimento do mesmo titular em outra UF é equiparada à comercialização pelo §13, observadas as demais condições.'],
  },
  {
    id: 'SC-TTD-409-410-NO-OTHER-PRESUMED-CREDIT',
    title: 'TTD 409/410: não cumulativo com outro crédito presumido',
    legalBasis: 'Lei 17.763/2019, art. 1º, §6º, I',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    effectiveFrom: '2019-08-13',
    status: 'validated',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'exit.otherPresumedCredit', operator: 'eq', value: true },
    ],
    treatment: { subsequentCreditPresumed: false },
    notes: ['A regra do TTD deve substituir o outro crédito presumido, salvo hipótese específica de compatibilidade prevista na legislação.'],
  },
  {
    id: 'SC-TTD-409-410-BASE-REDUCTION-FLOOR',
    title: 'TTD 409/410: piso quando houver redução de base',
    legalBasis: 'Lei 17.763/2019, art. 1º, §5º',
    source: 'https://legislacao.sef.sc.gov.br/html/leis/2019/lei_19_17763.htm',
    effectiveFrom: '2019-08-13',
    status: 'validated',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'exit.hasBaseReduction', operator: 'eq', value: true },
    ],
    treatment: { subsequentCreditPresumed: true },
    notes: ['O crédito presumido não pode resultar em carga final menor que a apurada sem a redução de base.'],
  },
  {
    id: 'SC-TTD-409-410-EXCLUSION-DEC-2128',
    title: 'TTD 409/410: mercadorias excluídas pelo Decreto 2.128/2009',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246, §27, I; Decreto 2.128/2009',
    source: 'https://legislacao.sef.sc.gov.br/Consulta/Views/Publico/Copat.aspx',
    effectiveFrom: '2019-08-13',
    status: 'requires_lookup',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'product.dec2128Excluded', operator: 'eq', value: true },
    ],
    treatment: { importDeferral: 'none', subsequentCreditPresumed: false },
    notes: ['A lista de exclusões deve ser consultada por NCM e descrição. O motor não deve inferir exclusão apenas pela denominação comercial.', 'COPAT 2/2026 e 4/2026 demonstram que descrição e NCM precisam ser analisadas conjuntamente.'],
  },
  {
    id: 'SC-TTD-409-410-USED-GOODS',
    title: 'TTD 409/410: bens e mercadorias usados',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246, §27, II',
    source: 'https://legislacao.sef.sc.gov.br/Consulta/Views/Publico/Copat.aspx',
    effectiveFrom: '2019-08-13',
    status: 'validated',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409', '410'] },
      { field: 'product.used', operator: 'eq', value: true },
    ],
    treatment: { importDeferral: 'none', subsequentCreditPresumed: false },
    notes: ['A vedação alcança bens e mercadorias usados nos termos da legislação indicada.'],
  },
  {
    id: 'SC-TTD-409-410-NCM-POSITION-MUST-MATCH',
    title: 'TTD 409/410: manutenção da posição NCM após fracionamento/processamento',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246, §6º, I; COPAT 10/2026',
    source: 'https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=C7DFBF84-4903-469D-A2CC-FAC40C2BEF73',
    effectiveFrom: '2026-03-19',
    status: 'validated',
    conditions: [
      { field: 'exit.hasProcessing', operator: 'eq', value: true },
      { field: 'product.resultNcmPositionSameAsImported', operator: operator as never, value: true },
    ],
    treatment: { subsequentCreditPresumed: true },
    notes: ['A regra deve ser avaliada pela posição NCM vigente no momento da saída.', 'A alteração apenas do código interno, sem transformação substancial e mantendo a posição NCM, não impede o benefício.', 'Se o processo alterar a posição NCM, o crédito presumido fica impedido.'],
  },
];
