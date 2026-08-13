import { SC_IMPORT_SPECIAL_REGIMES_2026 } from './sc-import-special-regimes';

type ScImportRule = { id: string; title: string; legalBasis: string; source: string; effectiveFrom: string; status: 'validated' | 'conditional' | 'requires_lookup' };

export const SC_IMPORT_RULES_2026: ScImportRule[] = [
  { id: 'SC-TTD-409-IMPORT', title: 'TTD 409 - diferimento na importação para comercialização', legalBasis: 'RICMS/SC, Anexo 2, art. 246, I', source: 'SEF/SC - Consultas COPAT 025/2026 e 029/2026', effectiveFrom: '2026-01-01', status: 'conditional' },
  { id: 'SC-TTD-410-IMPORT', title: 'TTD 410 - diferimento na importação para comercialização', legalBasis: 'RICMS/SC, Anexo 2, art. 246, I', source: 'SEF/SC - Consultas COPAT 019/2026 e 029/2026', effectiveFrom: '2026-01-01', status: 'conditional' },
  { id: 'SC-IMPORT-ICMS-GENERAL', title: 'ICMS na importação - cálculo por dentro', legalBasis: 'RICMS/SC, art. 9, IV; Lei 10.297/1996, art. 10, V', source: 'SEF/SC - Resolução Normativa 088/2024', effectiveFrom: '2024-01-01', status: 'validated' },
];

export type ScRuleCoverage = { area: string; rules: number; statuses: { validated: number; conditional: number; requires_lookup: number } };
export const SC_IMPORT_RULE_CATALOG = { ttdAndGeneral: SC_IMPORT_RULES_2026, specialRegimes: SC_IMPORT_SPECIAL_REGIMES_2026 } as const;

export function getScImportRuleCoverage(): ScRuleCoverage[] {
  const ttd = SC_IMPORT_RULES_2026.reduce<{ validated: number; conditional: number; requires_lookup: number }>((acc, rule) => { acc[rule.status]++; return acc; }, { validated: 0, conditional: 0, requires_lookup: 0 });
  const special = SC_IMPORT_SPECIAL_REGIMES_2026.reduce<{ validated: number; conditional: number; requires_lookup: number }>((acc, rule) => { acc[rule.status]++; return acc; }, { validated: 0, conditional: 0, requires_lookup: 0 });
  return [
    { area: 'TTD 409/410 e regras gerais de importação/saída', rules: SC_IMPORT_RULES_2026.length, statuses: ttd },
    { area: 'Regimes especiais de importação fora do TTD 409/410', rules: SC_IMPORT_SPECIAL_REGIMES_2026.length, statuses: special },
  ];
}

export function scScenarioCanProduceDefinitiveResult(ruleIds: string[]): boolean {
  const all = [...SC_IMPORT_RULES_2026, ...SC_IMPORT_SPECIAL_REGIMES_2026];
  return ruleIds.every((id) => all.find((rule) => rule.id === id)?.status === 'validated');
}
