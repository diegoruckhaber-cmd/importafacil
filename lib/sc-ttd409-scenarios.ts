export type ScTtd409Scenario = {
  id: string;
  status: 'validated' | 'conditional';
  legalBasis: string;
  source: string;
  conditions: string[];
  outcome: string;
};

/** High-value TTD 409/410 scenario rules derived from current COPAT guidance. */
export const SC_TTD409_SCENARIOS_2026: ScTtd409Scenario[] = [
  {
    id: 'SC-TTD409-MERCOSUL-OTHER-UF-LAND', status: 'validated',
    legalBasis: 'Lei 17.763/2019, art. 1º, §1º, II, a; COPAT 25/2026',
    source: 'https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=02BF593D-8F68-4FF8-AD31-737BADC01E49',
    conditions: ['Importação por conta própria', 'origem MERCOSUL', 'entrada/desembaraço em outra UF', 'via exclusivamente terrestre', 'estabelecimento importador/destinatário jurídico em SC', 'demais condições do TTD satisfeitas'],
    outcome: 'O ICMS-importação é de SC e o tratamento do art. 246 pode ser aplicado, observadas as condições do regime.'
  },
  {
    id: 'SC-TTD409-DIRECT-SALE-FROM-CUSTOMS', status: 'conditional',
    legalBasis: 'COPAT 25/2026',
    source: 'https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=02BF593D-8F68-4FF8-AD31-737BADC01E49',
    conditions: ['Mercadoria ainda em recinto alfandegado', 'venda subsequente ao adquirente em outra UF', 'documentação e demais condições do regime satisfeitas'],
    outcome: 'Pode haver aplicação do diferimento e crédito presumido; o sistema deve tratar a saída como cenário específico, inclusive CFOP e local do adquirente, sem presumir a mesma base de uma venda comum.'
  },
  {
    id: 'SC-TTD409-TRANSFER-OTHER-UF', status: 'conditional',
    legalBasis: 'Lei 17.763/2019, art. 1º, §13; COPAT 60/2025',
    source: 'https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=4568F03B-5CB3-4AEC-981D-BE57D3742C65',
    conditions: ['Transferência para estabelecimento do mesmo titular localizado em outra UF', 'opção/equiparação exigida pela legislação quando aplicável'],
    outcome: 'A transferência interestadual pode equivaler à comercialização para fins do benefício, observadas as condições do regime e a opção legal pertinente.'
  },
  {
    id: 'SC-TTD409-REPACK-KIT', status: 'validated',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246, §6º, I; COPAT 21/2023',
    source: 'https://legislacao.sef.sc.gov.br/Consulta/Views/Publico/DocumentoLegalViewer.ashx?id=30D26B56-975B-46B1-A778-EBD992434DE6',
    conditions: ['Reembalagem/acondicionamento em kit pelo próprio importador', 'sem alteração das características essenciais', 'posição NCM preservada'],
    outcome: 'A operação, por si só, não descaracteriza o TTD 409.'
  },
  {
    id: 'SC-TTD409-FRACTION-SAME-POSITION', status: 'validated',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246, §6º, I; COPAT 10/2026',
    source: 'https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=C7DFBF84-4903-469D-A2CC-FAC40C2BEF73',
    conditions: ['Corte/rebobinamento ou fracionamento sem alteração substancial', 'posição NCM mantida'],
    outcome: 'Não há impedimento automático ao crédito presumido.'
  },
  {
    id: 'SC-TTD409-FRACTION-CHANGED-POSITION', status: 'validated',
    legalBasis: 'COPAT 10/2026',
    source: 'https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=C7DFBF84-4903-469D-A2CC-FAC40C2BEF73',
    conditions: ['Fracionamento altera a posição NCM do produto resultante'],
    outcome: 'O crédito presumido fica impedido, ainda que o processo não seja considerado industrialização.'
  },
  {
    id: 'SC-TTD410-INDUSTRIALIZATION-OUTSIDE-SC', status: 'validated',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246, §6º, I; COPAT 74/2025',
    source: 'https://legislacao.sef.sc.gov.br/Consulta/Views/Publico/DocumentoLegalViewer.ashx?id=506501B0-D262-4155-BD83-258E14CA1C84',
    conditions: ['Mercadoria importada com TTD 410', 'produto submetido a industrialização fora de SC'],
    outcome: 'Não é possível manter o crédito presumido do TTD 410 na saída do produto resultante.'
  },
  {
    id: 'SC-TTD410-TTD77-SAME-IMPORT', status: 'validated',
    legalBasis: 'COPAT 19/2026; COPAT 22/2023',
    source: 'https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=5E464851-4EF2-4DA5-9A38-8E8D716AAC73',
    conditions: ['Beneficiário possui TTD 410 e TTD 77', 'mercadorias têm destinações distintas após a importação'],
    outcome: 'É possível desembaraçar sob TTD 410 e usar o crédito presumido somente nas saídas comerciais, tratando normalmente as mercadorias efetivamente destinadas à industrialização.'
  },
];
