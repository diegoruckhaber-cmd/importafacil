export type ScCheckpointStatus = 'mapped' | 'catalog_required' | 'interpretation_required';

export type ScLawCheckpoint = {
  id: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: ScCheckpointStatus;
  source: string;
  scope: string;
  notes: string;
};

/** Current-law checkpoints found during the SC import-tax review.
 * These are deliberately not treated as final calculations until the
 * referenced catalogs/conditions are fully modeled and independently tested.
 */
export const SC_CURRENT_LAW_CHECKPOINTS: ScLawCheckpoint[] = [
  {
    id: 'AN2-ART3-IMPORT-EXEMPTIONS',
    status: 'catalog_required',
    source: 'RICMS/SC Anexo 2 art. 3',
    scope: 'entradas/importações com isenção',
    notes: 'Modelar inciso a inciso; várias hipóteses dependem de listas do Anexo 1, beneficiário, finalidade, ausência de similar e documentação.'
  },
  {
    id: 'AN2-ART29-AGRO',
    effectiveFrom: '2026-03-01',
    status: 'catalog_required',
    source: 'Decreto 1.427/2026; RICMS/SC Anexo 2 arts. 29-33',
    scope: 'insumos agropecuários',
    notes: 'NCM, registro MAPA, finalidade e extensão do tratamento ao similar importado precisam ser avaliados por operação.'
  },
  {
    id: 'AN2-ART246-TTD409-410',
    status: 'interpretation_required',
    source: 'RICMS/SC Anexo 2 art. 246; Lei 17.763/2019',
    scope: 'TTD 409/410',
    notes: 'Separar diferimento da importação, crédito presumido na saída, ato concessivo, 36 meses, exceções, destinação e compatibilidade.'
  },
  {
    id: 'AN2-ART246-280M',
    effectiveFrom: '2026-03-19',
    status: 'mapped',
    source: 'Alteração 4.971 / Lei 19.670/2025',
    scope: 'exceção ao período de 36 meses',
    notes: 'Limite anual de R$ 280 milhões; requer dado agregado e autorização prévia do Fisco.'
  },
  {
    id: 'DEC-2128-ANNEX',
    status: 'catalog_required',
    source: 'Decreto 2.128/2009 e alterações de 2026',
    scope: 'mercadorias não alcançadas por tratamentos diferenciados',
    notes: 'Catálogo versionado por NCM/descrição e condições de destinação; não reduzir a uma regra booleana.'
  },
  {
    id: 'ART110B-MERCOSUR',
    status: 'catalog_required',
    source: 'RICMS/SC art. 110-B; alterações 2026',
    scope: 'Mercosul com entrada/desembaraço em outra UF',
    notes: 'Calcular percentual sobre operações abrangidas no período e aplicar exceções; Paraguai/Uruguai exigem tratamento próprio conforme legislação e COPAT.'
  },
  {
    id: 'COPAT-025-2026',
    status: 'interpretation_required',
    source: 'COPAT 25/2026',
    scope: 'Paraguai/Mercosul, TTD 409, entrada em outra UF por via terrestre',
    notes: 'Registrar como interpretação vinculada ao cenário, sem generalizar para todas as origens Mercosul.'
  },
  {
    id: 'COPAT-026-2026',
    status: 'interpretation_required',
    source: 'COPAT 26/2026',
    scope: 'bicarbonato de sódio NCM 2836.30.00 / Convênio 100/97',
    notes: 'Benefício de saída e extensão ao similar importado dependem de finalidade, registro MAPA e origem GATT/OMC.'
  },
  {
    id: 'AN2-REPORTO',
    status: 'catalog_required',
    source: 'RICMS/SC Anexo 2; Anexo 1 Seção XXX',
    scope: 'REPORTO',
    notes: 'Lista de bens, ausência de similar, beneficiário, uso exclusivo e localização portuária precisam ser dados estruturados.'
  },
  {
    id: 'AN2-DRAWBACK',
    status: 'interpretation_required',
    source: 'RICMS/SC Anexo 2 arts. 46-47',
    scope: 'Drawback Integrado Suspensão',
    notes: 'Ato concessivo, suspensão federal, vínculo com exportação e encerramento devem ser verificáveis.'
  },
  {
    id: 'AN2-ZPE',
    status: 'interpretation_required',
    source: 'RICMS/SC Anexo 2 arts. 111-112',
    scope: 'ZPE',
    notes: 'Separar entrada, permanência e eventual saída para mercado interno.'
  },
  {
    id: 'AN2-REPETRO',
    status: 'catalog_required',
    source: 'RICMS/SC Anexo 2 arts. 179-188-E',
    scope: 'REPETRO/REPETRO-SPED',
    notes: 'Modalidade, bem, NCM/lista, beneficiário, destinação e carga efetiva devem ser parametrizados.'
  },
  {
    id: 'GLME-ACCOUNT-ORDER',
    status: 'mapped',
    source: 'RICMS/SC Anexo 6 art. 192 e alterações de 2026',
    scope: 'documentação/exoneração em importação',
    notes: 'Fluxo documental permanece separado do mérito de elegibilidade e do cálculo.'
  }
];
