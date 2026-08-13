export type ScRuleState = 'mapped' | 'conditional' | 'catalog_required' | 'legal_review';

export type ScInterpretation = {
  id: string;
  source: string;
  trigger: string;
  decision: string;
  state: ScRuleState;
  productionSafe: boolean;
  notes: string;
};

/**
 * Context-sensitive interpretations that must not be reduced to a single
 * percentage. These records feed the rule engine and preserve the distinction
 * between legal text, factual trigger and computational consequence.
 */
export const SC_INTERPRETATION_MATRIX: ScInterpretation[] = [
  {
    id: 'COPAT-010-2026-NCM-PRESERVED',
    source: 'COPAT 010/2026',
    trigger: 'Fracionamento/corte/rebobinamento de mercadoria importada sem alteração substancial',
    decision: 'TTD 409/410 pode permanecer quando a mercadoria resultante mantém a mesma posição NCM e demais condições do regime são satisfeitas',
    state: 'mapped',
    productionSafe: false,
    notes: 'Exige confirmação da classificação fiscal antes da decisão automática.',
  },
  {
    id: 'COPAT-010-2026-NCM-CHANGED',
    source: 'COPAT 010/2026',
    trigger: 'Fracionamento altera a posição NCM da mercadoria resultante',
    decision: 'Crédito presumido do TTD 409/410 não deve ser presumido para a saída da mercadoria reclassificada',
    state: 'mapped',
    productionSafe: false,
    notes: 'A regra é interpretativa e deve permanecer vinculada aos fatos analisados.',
  },
  {
    id: 'COPAT-019-2026-MIXED-DESTINATION',
    source: 'COPAT 019/2026',
    trigger: 'Importação sob TTD 410 com parte da mercadoria destinada à comercialização e parte à industrialização',
    decision: 'Desembaraço pode ocorrer integralmente sob TTD 410; crédito presumido fica restrito às saídas comerciais e mercadoria destinada à industrialização segue tratamento próprio',
    state: 'mapped',
    productionSafe: false,
    notes: 'A operação deve manter rastreabilidade por item/destinação.',
  },
  {
    id: 'COPAT-025-2026-PY-LAND',
    source: 'COPAT 025/2026',
    trigger: 'Mercadoria originária do Paraguai, importação por conta própria, entrada/desembaraço em outra UF por via terrestre e importador estabelecido em SC',
    decision: 'Aplicação do tratamento do art. 246 pode ser admitida, observadas as condições do TTD e da legislação vigente',
    state: 'conditional',
    productionSafe: false,
    notes: 'Exige dados de origem, rota, estabelecimento importador, destinatário e operação subsequente.',
  },
  {
    id: 'COPAT-026-2026-AGRO-BICARBONATE',
    source: 'COPAT 026/2026',
    trigger: 'Bicarbonato de sódio NCM 2836.30.00 utilizado como aditivo regulador de acidez na alimentação animal e registrado no MAPA',
    decision: 'Tratamento de insumo agropecuário pode ser reconhecido, observadas as condições do Convênio ICMS 100/97 e legislação catarinense',
    state: 'conditional',
    productionSafe: false,
    notes: 'Finalidade, registro MAPA, origem e demais requisitos devem ser dados explícitos da operação.',
  },
  {
    id: 'COPAT-029-2026-TRANSPORT',
    source: 'COPAT 029/2026',
    trigger: 'Saída interna de pneumáticos/câmaras/rodas para transportadora contribuinte que utiliza os bens em prestação tributada pelo ICMS',
    decision: 'Aplicar o tratamento de saída correspondente, incluindo diferimento parcial quando as condições forem satisfeitas; crédito do adquirente depende da utilização tributada',
    state: 'conditional',
    productionSafe: false,
    notes: 'É efeito da saída subsequente e não deve ser aplicado automaticamente ao cálculo do desembaraço.',
  },
  {
    id: 'COPAT-038-2024-246-REDUCTION',
    source: 'COPAT 038/2024',
    trigger: 'TTD 409/410 combinado com redução de base do art. 12 do Anexo 2',
    decision: 'A combinação pode produzir carga de ICMS e fundos distinta da alíquota nominal; regra deve calcular destaque/recolhimento conforme condições vigentes',
    state: 'conditional',
    productionSafe: false,
    notes: 'Manter fundos e redução de base como componentes separados no cálculo auditável.',
  },
  {
    id: 'COPAT-060-2025-TRANSFER',
    source: 'COPAT 060/2025',
    trigger: 'Mercadoria importada sob TTD 409/410 transferida para estabelecimento do mesmo titular em outra UF',
    decision: 'O crédito presumido exige a hipótese legal de equiparação à operação sujeita ao fato gerador; saída interna para estabelecimento do mesmo titular não deve ser tratada como saída comercial beneficiada',
    state: 'conditional',
    productionSafe: false,
    notes: 'Exige modelagem específica de transferência e opção prevista na legislação.',
  },
];

export function getScInterpretationsForContext(ids: string[]): ScInterpretation[] {
  const wanted = new Set(ids);
  return SC_INTERPRETATION_MATRIX.filter(item => wanted.has(item.id));
}

export function hasProductionSafeScInterpretation(id: string): boolean {
  return SC_INTERPRETATION_MATRIX.some(item => item.id === id && item.productionSafe);
}
