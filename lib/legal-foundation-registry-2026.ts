export type LegalAuthority =
  | "constitution"
  | "complementary_law"
  | "ordinary_law"
  | "decree"
  | "state_regulation"
  | "state_decree"
  | "state_consultation"
  | "administrative_guidance";

export type LegalScope = "federal_import" | "sc_icms_import" | "sc_ttd" | "transition_2026";

export interface LegalSource {
  id: string;
  authority: LegalAuthority;
  scope: LegalScope;
  title: string;
  officialUrl: string;
  effectiveFrom?: string;
  notes: string;
}

/**
 * Canonical legal hierarchy used by the calculation engines.
 *
 * This registry intentionally separates:
 *  - binding primary law;
 *  - state regulations/decrees;
 *  - administrative interpretations.
 *
 * Administrative consultations may explain application, but must never
 * silently override an applicable statute, regulation or concession act.
 */
export const LEGAL_FOUNDATION_2026: readonly LegalSource[] = [
  {
    id: "CF-1988-TAX",
    authority: "constitution",
    scope: "federal_import",
    title: "Constituição Federal de 1988 — Sistema Tributário Nacional",
    officialUrl: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
    notes: "Base constitucional de competência tributária, legalidade e limitações ao poder de tributar.",
  },
  {
    id: "CTN-5172-1966",
    authority: "ordinary_law",
    scope: "federal_import",
    title: "Lei nº 5.172/1966 — Código Tributário Nacional",
    officialUrl: "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm",
    notes: "Normas gerais sobre obrigação tributária, fato gerador, base de cálculo, sujeito passivo e crédito tributário.",
  },
  {
    id: "DL-37-1966-II",
    authority: "ordinary_law",
    scope: "federal_import",
    title: "Decreto-Lei nº 37/1966 — Imposto de Importação",
    officialUrl: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del0037.htm",
    notes: "Fundamentos legais do Imposto de Importação e regras aduaneiras correlatas.",
  },
  {
    id: "DEC-6759-2009-RA",
    authority: "decree",
    scope: "federal_import",
    title: "Decreto nº 6.759/2009 — Regulamento Aduaneiro",
    officialUrl: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/decreto/d6759.htm",
    notes: "Regulamento central para despacho, valor aduaneiro, incidência e cobrança dos tributos na importação.",
  },
  {
    id: "TIPI-IPI-2022",
    authority: "decree",
    scope: "federal_import",
    title: "TIPI vigente — classificação e alíquotas do IPI",
    officialUrl: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/decreto/d1141.htm",
    notes: "A alíquota de IPI deve ser resolvida por NCM e vigência; o catálogo do sistema deve conservar a fonte e a data.",
  },
  {
    id: "DEC-7212-2010-RIPI",
    authority: "decree",
    scope: "federal_import",
    title: "Decreto nº 7.212/2010 — Regulamento do IPI",
    officialUrl: "https://planalto.gov.br/ccivil_03/_ato2007-2010/2010/decreto/d7212.htm",
    notes: "Regulamenta incidência, cobrança e administração do IPI, inclusive produtos estrangeiros.",
  },
  {
    id: "LEI-10865-2004-PIS-COFINS-IMPORT",
    authority: "ordinary_law",
    scope: "federal_import",
    title: "Lei nº 10.865/2004 — PIS/Pasep-Importação e Cofins-Importação",
    officialUrl: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l10.865compilado.htm",
    notes: "Fonte primária das incidências, bases, alíquotas e hipóteses específicas de PIS/Cofins na importação.",
  },
  {
    id: "LC-214-2025-RTC",
    authority: "complementary_law",
    scope: "transition_2026",
    title: "Lei Complementar nº 214/2025 — IBS, CBS e Imposto Seletivo",
    officialUrl: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm",
    effectiveFrom: "2026-01-01",
    notes: "Base legal da Reforma Tributária do Consumo e da transição que afeta importações e operações de 2026 em diante.",
  },
  {
    id: "LC-227-2026-CGIBS",
    authority: "complementary_law",
    scope: "transition_2026",
    title: "Lei Complementar nº 227/2026 — Comitê Gestor do IBS e processo administrativo",
    officialUrl: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm",
    effectiveFrom: "2026-01-01",
    notes: "Complementa a governança e o regime administrativo do IBS durante a transição.",
  },
  {
    id: "LC-87-1996-ICMS",
    authority: "complementary_law",
    scope: "sc_icms_import",
    title: "Lei Complementar nº 87/1996 — normas gerais do ICMS",
    officialUrl: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp87.htm",
    notes: "Base nacional para incidência, importação, base de cálculo e créditos do ICMS.",
  },
  {
    id: "SC-LEI-10297-1996",
    authority: "ordinary_law",
    scope: "sc_icms_import",
    title: "Lei nº 10.297/1996 — ICMS de Santa Catarina",
    officialUrl: "https://legislacao.sef.sc.gov.br/html/leis/1996/lei_96_10297.htm",
    notes: "Lei catarinense do ICMS, inclusive regras de importação e competência estadual.",
  },
  {
    id: "SC-RICMS-2870-2001",
    authority: "state_regulation",
    scope: "sc_icms_import",
    title: "Decreto nº 2.870/2001 — RICMS/SC",
    officialUrl: "https://legislacao.sef.sc.gov.br/html/decretos/2001/dec_01_2870.htm",
    notes: "Regulamento operacional do ICMS/SC. Regras devem ser resolvidas pela redação vigente na data do fato gerador.",
  },
  {
    id: "SC-ANEXO-02-ART-246-TTD",
    authority: "state_regulation",
    scope: "sc_ttd",
    title: "RICMS/SC — Anexo 2, art. 246 — TTD 409/410",
    officialUrl: "https://legislacao.sef.sc.gov.br/",
    notes: "Fonte normativa do diferimento na importação e do crédito presumido nas saídas subsequentes, mediante regime especial e respectivas condições.",
  },
  {
    id: "SC-ANEXO-03-ART-10-TTD77",
    authority: "state_regulation",
    scope: "sc_ttd",
    title: "RICMS/SC — Anexo 3, art. 10 — TTD 77",
    officialUrl: "https://legislacao.sef.sc.gov.br/",
    notes: "Tratamento tributário para importações destinadas a utilização como matéria-prima, material intermediário ou secundário em industrialização em SC, sujeito às condições do regime.",
  },
  {
    id: "SC-DEC-2128-2009",
    authority: "state_decree",
    scope: "sc_ttd",
    title: "Decreto nº 2.128/2009 — alcance dos regimes de importação",
    officialUrl: "https://legislacao.sef.sc.gov.br/html/decretos/2009/dec_09_2128.htm",
    notes: "Lista e disciplina mercadorias que não podem usufruir de determinados tratamentos tributários diferenciados na importação.",
  },
  {
    id: "SC-COPAT-010-2026",
    authority: "state_consultation",
    scope: "sc_ttd",
    title: "Consulta COPAT nº 010/2026 — TTD 409/410 e manutenção da posição NCM",
    officialUrl: "https://legislacao.sef.sc.gov.br/Consulta/Views/Publico/pesquisa2.aspx?x=409%2F410%3D",
    effectiveFrom: "2026-04-06",
    notes: "Interpretação administrativa: fracionamento que mantém a posição da NCM não impede, por si só, o TTD 409/410, observadas as demais condições e o Decreto 2.128/2009.",
  },
  {
    id: "SC-COPAT-019-2026",
    authority: "state_consultation",
    scope: "sc_ttd",
    title: "Consulta COPAT nº 019/2026 — TTD 410 e TTD 77",
    officialUrl: "https://legislacao.sef.sc.gov.br/consulta/views/Publico/DocumentoLegalViewer.ashx?id=5E464851-4EF2-4DA5-9A38-8E8D716AAC73",
    effectiveFrom: "2026-06-01",
    notes: "Interpretação administrativa sobre desembaraço sob TTD 410 e tratamento posterior de mercadorias destinadas à industrialização, sem substituir a análise do ato concessório.",
  },
] as const;

export function getLegalSource(id: string): LegalSource | undefined {
  return LEGAL_FOUNDATION_2026.find((source) => source.id === id);
}

export function getLegalSourcesByScope(scope: LegalScope): readonly LegalSource[] {
  return LEGAL_FOUNDATION_2026.filter((source) => source.scope === scope);
}

export function isPrimaryLaw(source: LegalSource): boolean {
  return ["constitution", "complementary_law", "ordinary_law", "decree", "state_regulation", "state_decree"].includes(source.authority);
}
