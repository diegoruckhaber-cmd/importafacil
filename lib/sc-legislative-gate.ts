export type ScLegislativeGateStatus = 'open' | 'blocked';

export type ScLegislativeChange = {
  id: string;
  decree: string;
  publishedOn: string;
  effectiveFrom?: string;
  scope: 'import-tax' | 'benefit-eligibility' | 'administrative' | 'out-of-scope';
  reviewed: boolean;
  incorporated: boolean;
  notes: string;
};

/**
 * Release gate for the Santa Catarina import-tax layer.
 * A reviewed change can be out of scope; an unreviewed change blocks release.
 */
export const SC_LEGISLATIVE_CHANGES_2026: ScLegislativeChange[] = [
  { id: 'SC-2026-1416', decree: '1.416/2026', publishedOn: '2026-02-12', effectiveFrom: '2026-02-12', scope: 'benefit-eligibility', reviewed: true, incorporated: true, notes: 'Vedação à fruição de crédito presumido em hipóteses específicas.' },
  { id: 'SC-2026-1417', decree: '1.417/2026', publishedOn: '2026-02-12', effectiveFrom: '2026-03-19', scope: 'benefit-eligibility', reviewed: true, incorporated: true, notes: 'Alteração de condição econômica do art. 246.' },
  { id: 'SC-2026-1427', decree: '1.427/2026', publishedOn: '2026-02-27', effectiveFrom: '2026-03-01', scope: 'import-tax', reviewed: true, incorporated: true, notes: 'Alterações nos tratamentos de insumos agropecuários.' },
  { id: 'SC-2026-1453', decree: '1.453/2026', publishedOn: '2026-03-18', effectiveFrom: '2026-03-01', scope: 'benefit-eligibility', reviewed: true, incorporated: true, notes: 'Alteração do Decreto 2.128/2009.' },
  { id: 'SC-2026-1477', decree: '1.477/2026', publishedOn: '2026-04-10', effectiveFrom: '2026-04-10', scope: 'benefit-eligibility', reviewed: true, incorporated: true, notes: 'Regulamentação de condicionantes econômicas/financeiras.' },
  { id: 'SC-2026-1551', decree: '1.551/2026', publishedOn: '2026-06-03', effectiveFrom: '2026-06-09', scope: 'benefit-eligibility', reviewed: true, incorporated: true, notes: 'Alterações do art. 110-B e condições para importações do Mercosul.' },
  { id: 'SC-2026-1571', decree: '1.571/2026', publishedOn: '2026-06-17', effectiveFrom: '2026-06-17', scope: 'import-tax', reviewed: false, incorporated: false, notes: 'Alteração 4.990 do RICMS/SC-01; revisão de impacto no escopo de importação pendente.' },
  { id: 'SC-2026-1615', decree: '1.615/2026', publishedOn: '2026-07-17', effectiveFrom: '2026-07-17', scope: 'out-of-scope', reviewed: false, incorporated: false, notes: 'Alteração 4.991 do RICMS/SC-01; impacto ainda precisa ser classificado antes do release.' },
];

export function getScLegislativeGateStatus(changes = SC_LEGISLATIVE_CHANGES_2026): ScLegislativeGateStatus {
  return changes.some(c => !c.reviewed) ? 'blocked' : 'open';
}
