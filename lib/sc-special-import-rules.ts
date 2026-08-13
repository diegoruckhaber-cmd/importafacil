import type { RuleCondition } from './rule-engine';

export type ScSpecialImportRule = {
  id: string;
  title: string;
  legalBasis: string;
  source: string;
  effectiveFrom: string;
  status: 'validated' | 'conditional' | 'requires_lookup';
  conditions: RuleCondition[];
  treatment: {
    importIc​​msHandling: 'special_apuration' | 'deferral' | 'normal' | 'lookup';
    notes: string[];
  };
};

/**
 * Special SC import treatments that must remain separate from TTD 409/410.
 * These entries deliberately do not encode a tax percentage when the legal
 * treatment depends on additional product/beneficiary conditions.
 */
export const SC_SPECIAL_IMPORT_RULES_2026: ScSpecialImportRule[] = [
  {
    id: 'SC-AGRO-INPUT-IMPORT-APURATION-2026',
    title: 'Insumos agropecuários importados: apuração especial do ICMS na entrada',
    legalBasis: 'RICMS/SC-01, art. 53, §26; Decreto 1.427/2026, Alteração 4.975',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1427.htm',
    effectiveFrom: '2026-03-01',
    status: 'conditional',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'product.agriculturalInput', operator: 'eq', value: true },
      { field: 'product.ncm', operator: 'in', value: ['2808.00','2807.00','2809.20','2510.1','2503.00','2814.20.00','3102.10','3102.21.00'] },
    ],
    treatment: {
      importIc​​msHandling: 'special_apuration',
      notes: ['A regra é específica para insumos agropecuários e exige validação da destinação e demais requisitos do dispositivo.', 'Não aplicar automaticamente apenas pela NCM.'],
    },
  },
  {
    id: 'SC-GLME-ACCOUNT-ORDER-VIEW-2026',
    title: 'Conta e ordem: visto da GLME pelo Estado do adquirente',
    legalBasis: 'RICMS/SC-01, Anexo 6, art. 192, I; Convênio ICMS 173/24; Decreto 1.386/2026',
    source: 'https://legislacao.sef.sc.gov.br/html/decretos/2026/dec_26_1386.htm',
    effectiveFrom: '2026-01-27',
    status: 'validated',
    conditions: [
      { field: 'operation.importStructure', operator: 'eq', value: 'account_order' },
    ],
    treatment: {
      importIc​​msHandling: 'lookup',
      notes: ['O visto da GLME é aposto pelo fisco da UF do adquirente em importação por conta e ordem.', 'Esta regra é procedimental e não determina, isoladamente, a alíquota ou o benefício aplicável.'],
    },
  },
  {
    id: 'SC-TTD-409-PARAGUAY-OTHER-UF-LAND-2026',
    title: 'TTD 409: importação por conta própria do Paraguai com entrada/desembaraço em outra UF',
    legalBasis: 'RICMS/SC-01, art. 110-B; COPAT 25/2026',
    source: 'https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=02BF593D-8F68-4FF8-AD31-737BADC01E49',
    effectiveFrom: '2026-06-09',
    status: 'conditional',
    conditions: [
      { field: 'operation.kind', operator: 'eq', value: 'import_entry' },
      { field: 'beneficiary.ttd', operator: 'eq', value: '409' },
      { field: 'product.originCountry', operator: 'eq', value: 'PY' },
      { field: 'customs.entryMode', operator: 'eq', value: 'land' },
      { field: 'customs.entryState', operator: 'neq', value: 'SC' },
      { field: 'customs.clearanceState', operator: 'neq', value: 'SC' },
    ],
    treatment: {
      importIc​​msHandling: 'deferral',
      notes: ['A entrada/desembaraço fora de SC não impede, por si só, a fruição quando atendidas as condições legais, regulamentares e do TTD.', 'A operação deve ser avaliada também quanto às condições agregadas do art. 110-B.'],
    },
  },
  {
    id: 'SC-TTD-410-TTD77-SPLIT-DESTINATION-2026',
    title: 'TTD 410 + TTD 77: importação integral sob TTD 410 e tratamento distinto nas saídas',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246; Anexo 3, art. 10; COPAT 19/2026',
    source: 'https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=5E464851-4EF2-4DA5-9A38-8E8D716AAC73',
    effectiveFrom: '2026-05-08',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'eq', value: '410' },
      { field: 'beneficiary.ttd77', operator: 'eq', value: true },
      { field: 'operation.mixedDestination', operator: 'eq', value: true },
    ],
    treatment: {
      importIc​​msHandling: 'deferral',
      notes: ['A importação pode ser integralmente desembaraçada sob o TTD 410; o crédito presumido fica restrito às saídas comerciais, enquanto mercadorias destinadas à industrialização seguem tributação normal.', 'Não permitir reclassificação posterior da importação para TTD 11.'],
    },
  },
  {
    id: 'SC-TTD-409-POST-IMPORT-KIT-REPACK',
    title: 'TTD 409: reembalagem/acondicionamento em kit pelo próprio importador',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246, §6º, I; COPAT 21/2023',
    source: 'https://legislacao.sef.sc.gov.br/Consulta/Views/Publico/pesquisa2.aspx?x=409%2F410%3D',
    effectiveFrom: '2023-07-14',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409','410'] },
      { field: 'postImport.process', operator: 'eq', value: 'repack_kit' },
      { field: 'postImport.ncmPositionPreserved', operator: 'eq', value: true },
    ],
    treatment: {
      importIc​​msHandling: 'deferral',
      notes: ['Reembalagem e acondicionamento em kit, sem alteração substancial e mantendo a posição NCM, não descaracterizam o tratamento.', 'Industrialização ou alteração de posição NCM exige avaliação própria.'],
    },
  },
  {
    id: 'SC-TTD-409-FRACTION-SAME-NCM-2026',
    title: 'TTD 409/410: fracionamento sem alteração da posição NCM',
    legalBasis: 'RICMS/SC-01, Anexo 2, art. 246, §6º, I; COPAT 10/2026',
    source: 'https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=C7DFBF84-4903-469D-A2CC-FAC40C2BEF73',
    effectiveFrom: '2026-03-19',
    status: 'conditional',
    conditions: [
      { field: 'beneficiary.ttd', operator: 'in', value: ['409','410'] },
      { field: 'postImport.process', operator: 'eq', value: 'physical_fractioning' },
      { field: 'postImport.ncmPositionPreserved', operator: 'eq', value: true },
    ],
    treatment: {
      importIc​​msHandling: 'deferral',
      notes: ['Corte/rebobinamento para ajuste dimensional, sem alteração substancial e mantendo a mesma posição NCM, não impede o crédito presumido.', 'Alteração da posição NCM impede o crédito presumido nas condições analisadas pela COPAT.'],
    },
  },
];
