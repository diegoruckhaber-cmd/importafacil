export type ScCoverageStatus = 'implemented' | 'conditional' | 'requires_catalog' | 'not_in_import_scope';

export type ScCoverage = {
  family: string;
  scope: string;
  status: ScCoverageStatus;
  nextRequirement?: string;
};

/**
 * Coverage contract for Santa Catarina. The calculator's SC scope is import
 * tax treatment plus the immediate subsequent operation needed to determine
 * the economic result. This prevents claiming "SC complete" while a product
 * list, concessive act or sector-specific regime is still missing.
 */
export const SC_IMPORT_COVERAGE: ScCoverage[] = [
  { family: 'Alíquota modal de entrada', scope: 'ICMS importação', status: 'implemented' },
  { family: 'Alíquotas internas de saída', scope: '12% / 17% / 25% e exceções contextuais', status: 'conditional', nextRequirement: 'Catálogo de mercadorias e exceções do art. 26/Anexo 1.' },
  { family: 'TTD 409/410', scope: 'Importação para comercialização e saídas subsequentes', status: 'implemented' },
  { family: 'TTD 77', scope: 'Importação para industrialização em SC', status: 'implemented' },
  { family: 'Decreto 2.128/2009', scope: 'Mercadorias excluídas dos tratamentos de importação', status: 'requires_catalog', nextRequirement: 'Catálogo versionado por NCM + descrição + vigência.' },
  { family: 'Reduções de base de cálculo', scope: 'Saída subsequente quando compatível com o regime', status: 'requires_catalog', nextRequirement: 'Catálogo NCM/benefício/vigência e regras de compatibilidade.' },
  { family: 'Isenções', scope: 'Importação e saída subsequente', status: 'requires_catalog', nextRequirement: 'Catálogo de isenções por produto, origem e condições.' },
  { family: 'Substituição tributária', scope: 'Saída subsequente quando aplicável', status: 'requires_catalog', nextRequirement: 'Catálogo NCM/CEST/MVA/protocolo/vigência e regras de cálculo.' },
  { family: 'Regimes especiais adicionais', scope: 'Importação/saída', status: 'requires_catalog', nextRequirement: 'Mapear regimes como TTD 11, Pró-Emprego e tratamentos setoriais que possam afetar importação.' },
  { family: 'Diferimentos específicos', scope: 'Importação e circulação posterior', status: 'requires_catalog', nextRequirement: 'Catálogo por dispositivo, produto, finalidade e destinatário.' },
  { family: 'Créditos fiscais', scope: 'Aproveitamento econômico após importação', status: 'conditional', nextRequirement: 'Modelar créditos efetivos, presumidos e limitações por regime.' },
  { family: 'Fundos/encargos vinculados a benefícios', scope: 'TTD e tratamentos estaduais', status: 'conditional', nextRequirement: 'Mapear cada fundo e sua relação com a carga efetiva do regime.' },
  { family: 'Operações com destinatários especiais', scope: 'Simples, consumidor final, transportadoras, ativo/uso/consumo', status: 'conditional', nextRequirement: 'Adicionar contexto de destinatário às regras de saída.' },
  { family: 'Transferências entre estabelecimentos', scope: 'Mesmo titular SC/interestadual', status: 'conditional', nextRequirement: 'Modelar opção/equiparação e tratamento do crédito conforme destino.' },
  { family: 'Importação por conta e ordem/encomenda', scope: 'ICMS e saída do importador', status: 'conditional', nextRequirement: 'Modelar modalidade de importação e base específica da saída.' },
  { family: 'Benefícios setoriais de importação', scope: 'Ex.: aeronaves, ativos e regimes vinculados a setores', status: 'requires_catalog', nextRequirement: 'Catalogar somente quando alterarem o resultado de uma operação de importação.' },
];
