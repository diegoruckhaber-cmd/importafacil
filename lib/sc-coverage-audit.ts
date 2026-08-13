export type ScCoverageStatus = 'covered' | 'needs_catalog' | 'needs_rule_detail' | 'needs_legal_review';

export type ScCoverageItem = {
  id: string;
  source: string;
  scope: string;
  status: ScCoverageStatus;
  blocking: boolean;
  notes: string;
};

/**
 * SC release audit. This is intentionally conservative: a family is not
 * considered covered merely because its legal article was found. Product
 * lists, beneficiary conditions, vigency and compatibility must also be
 * represented before production release.
 */
export const SC_COVERAGE_AUDIT: ScCoverageItem[] = [
  { id: 'INCIDENCE', source: 'Lei 10.297/1996; RICMS/SC', scope: 'fato gerador, local e momento da importação', status: 'covered', blocking: false, notes: 'Base estrutural separada do cálculo de saída.' },
  { id: 'MODAL-RATE', source: 'RICMS/SC art. 26', scope: 'alíquota interna aplicável à entrada importada', status: 'needs_rule_detail', blocking: true, notes: 'Fechar exceções, NCM/Seção I do Anexo 1 e vigência.' },
  { id: 'ANNEX2-ART3', source: 'RICMS/SC Anexo 2 art. 3', scope: 'isenções específicas na entrada/importação', status: 'needs_catalog', blocking: true, notes: 'Cada inciso deve ser modelado com NCM/lista, beneficiário, finalidade, documentação e vigência.' },
  { id: 'ANNEX2-ART4', source: 'RICMS/SC Anexo 2 art. 4', scope: 'retorno, bagagem, amostras, medicamentos e hipóteses especiais', status: 'needs_rule_detail', blocking: true, notes: 'Separar importação formal de regimes simplificados e hipóteses sem GLME.' },
  { id: 'ANNEX2-REDUCTIONS', source: 'RICMS/SC Anexo 2', scope: 'reduções de base com efeito na importação/saída subsequente', status: 'needs_rule_detail', blocking: true, notes: 'Mapear artigos e condições que alcançam entrada importada, sem confundir benefício de saída com benefício da importação.' },
  { id: 'ANN3-DEFERRAL', source: 'RICMS/SC Anexo 3', scope: 'diferimentos relevantes à entrada importada', status: 'needs_rule_detail', blocking: true, notes: 'Fechar arts. 6, 10, 10-D, 10-P e demais hipóteses efetivamente aplicáveis à importação.' },
  { id: 'TTD409-410', source: 'Lei 17.763/2019; RICMS Anexo 2 art. 246', scope: 'TTD 409/410 e efeitos na importação/saída', status: 'needs_rule_detail', blocking: true, notes: 'Separar diferimento, crédito presumido, limites, fundos, destinação, transferências e ato concessivo.' },
  { id: 'TTD77', source: 'RICMS/SC; COPAT 019/2026', scope: 'matéria-prima/intermediário/secundário e industrialização', status: 'needs_rule_detail', blocking: true, notes: 'Modelar coexistência e incompatibilidades com TTD 409/410.' },
  { id: 'DEC2128', source: 'Decreto 2.128/2009; Decreto 1.453/2026', scope: 'mercadorias excluídas de tratamentos diferenciados', status: 'needs_catalog', blocking: true, notes: 'Lista NCM/descrição versionada; itens 62-76 possuem condição de destinação desde 01/03/2026.' },
  { id: 'MERCOSUR-110B', source: 'RICMS art. 110-B; Decreto 1.551/2026', scope: 'tratamentos para importação terrestre Mercosul com entrada/desembaraço em outra UF', status: 'needs_catalog', blocking: true, notes: 'Fechar percentual agregado, período, exceções da Seção LXXV e demais exceções do §1º.' },
  { id: 'REPORTO', source: 'RICMS/SC Anexo 2 e Anexo 3', scope: 'importação e utilização em portos', status: 'needs_rule_detail', blocking: true, notes: 'Exigir ativo, finalidade, similaridade, desoneração federal e demais condições.' },
  { id: 'DRAWBACK', source: 'RICMS/SC Anexo 2 arts. 46-47', scope: 'drawback integrado suspensão', status: 'needs_rule_detail', blocking: true, notes: 'Relacionar ato concessivo, suspensão federal, exportação e encerramento.' },
  { id: 'ZPE', source: 'RICMS/SC Anexo 2 arts. 111-112', scope: 'entrada em ZPE e descaracterização', status: 'needs_rule_detail', blocking: true, notes: 'Modelar entrada, permanência e saída para mercado interno.' },
  { id: 'REPETRO', source: 'RICMS/SC Anexo 2 arts. 179-188-E', scope: 'REPETRO/REPETRO-SPED e modalidades correlatas', status: 'needs_catalog', blocking: true, notes: 'Separar modalidades, NCM/listas, beneficiário, utilização econômica, suspensão/redução/carga.' },
  { id: 'AGRO-IMPORT', source: 'Decreto 1.427/2026', scope: 'insumos agropecuários importados e apuração específica', status: 'needs_catalog', blocking: true, notes: 'Versionar NCMs e conectar com art. 53 e Decreto 2.128.' },
  { id: 'BENEFICIARY', source: 'RICMS/SC; alterações 2026', scope: 'regularidade fiscal, condições do beneficiário e ato concessivo', status: 'needs_rule_detail', blocking: true, notes: 'Exceções e DCIP não podem ser reduzidas a regra binária.' },
  { id: 'PERIOD-CONTROLS', source: 'RICMS/SC art. 110-B e art. 246', scope: 'limites e métricas acumuladas por período', status: 'needs_rule_detail', blocking: true, notes: 'O cálculo deve aceitar dados históricos/agregados, não apenas a operação corrente.' },
  { id: 'GLME', source: 'RICMS/SC Anexo 6 art. 192; Decreto 1.386/2026', scope: 'exoneração, pagamento e fluxo documental', status: 'covered', blocking: false, notes: 'Procedimento separado do mérito do benefício tributário.' },
  { id: 'POST-IMPORT', source: 'RICMS/SC Anexos 2 e 3; COPAT 2026', scope: 'saída subsequente, transferência, industrialização e encerramento', status: 'needs_rule_detail', blocking: true, notes: 'Não considerar o tratamento da entrada suficiente para determinar a carga final.' },
  { id: 'COPAT-2026', source: 'Consultas COPAT publicadas em 2026', scope: 'interpretações oficiais relevantes ao escopo', status: 'needs_legal_review', blocking: true, notes: 'Varredura final deve identificar consultas que alterem elegibilidade, compatibilidade ou interpretação de regra.' },
  { id: '2026-ALTERATIONS', source: 'Índice de Decretos/SEF-SC 2026', scope: 'alterações 4.953 em diante com possível impacto', status: 'needs_legal_review', blocking: true, notes: 'Cada alteração relevante precisa ser classificada antes do release gate.' },
];

export function isScCoverageReleaseReady(): boolean {
  return SC_COVERAGE_AUDIT.every(item => !item.blocking || item.status === 'covered');
}
