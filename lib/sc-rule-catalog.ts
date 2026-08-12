import { SC_IMPORT_RULES_2026 } from './sc-import-rules';
import { SC_IMPORT_SPECIAL_REGIMES_2026 } from './sc-import-special-regimes';

export type ScRuleCoverage = {
  area: string;
  rules: number;
  statuses: { validated: number; conditional: number; requires_lookup: number };
};

export const SC_IMPORT_RULE_CATALOG = { ttdAndGeneral: SC_IMPORT_RULES_2026, specialRegimes: SC_IMPORT_SPECIAL_REGIMES_2026 } as const;

export function getScImportRuleCoverage(): ScRuleCoverage[] {
  const ttd = SC_IMPORT_RULES_2026.reduce((acc, rule) => { acc[rule.status]++; return acc; }, { validated: 0, conditional: 0, requires_lookup: 0 });
  const special = SC_IMPORT_SPECIAL_REGIMES_2026.reduce((acc, rule) => { acc[rule.status]++; return acc; }, { validated: 0, conditional: 0, requires_lookup: 0 });
  return [
    { area: 'TTD 409/410 e regras gerais de importação/saída', rules: SC_IMPORT_RULES_2026.length, statuses: ttd },
    { area: 'Regimes especiais de importação fora do TTD 409/410', rules: SC_IMPORT_SPECIAL_REGIMES_2026.length, statuses: special },
  ];
}

/** Blocks a definitive result when any rule required by a scenario is not validated. */
export function scScenarioCanProduceDefinitiveResult(ruleIds: string[]): boolean {
  const all = [...SC_IMPORT_RULES_2026, ...SC_IMPORT_SPECIAL_REGIMES_2026];
  return ruleIds.every(id => all.find(rule => rule.id === id)?.status === 'validated');
}
