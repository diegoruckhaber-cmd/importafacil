import { LEGAL_FOUNDATION_2026, getLegalSource, getLegalSourcesByScope, isPrimaryLaw } from "../lib/legal-foundation-registry-2026.ts";

const requiredIds = [
  "CF-1988-TAX",
  "CTN-5172-1966",
  "DL-37-1966-II",
  "DEC-6759-2009-RA",
  "DEC-7212-2010-RIPI",
  "LEI-10865-2004-PIS-COFINS-IMPORT",
  "LC-214-2025-RTC",
  "LC-87-1996-ICMS",
  "SC-LEI-10297-1996",
  "SC-RICMS-2870-2001",
  "SC-ANEXO-02-ART-246-TTD",
  "SC-ANEXO-03-ART-10-TTD77",
  "SC-DEC-2128-2009",
  "SC-COPAT-010-2026",
  "SC-COPAT-019-2026",
];

for (const id of requiredIds) {
  const source = getLegalSource(id);
  if (!source) throw new Error(`Fonte jurídica ausente: ${id}`);
  if (!source.title || !source.officialUrl || !source.notes) {
    throw new Error(`Fonte jurídica incompleta: ${id}`);
  }
}

if (getLegalSourcesByScope("federal_import").length < 6) throw new Error("Base federal de importação insuficiente.");
if (getLegalSourcesByScope("sc_icms_import").length < 3) throw new Error("Base ICMS/SC insuficiente.");
if (getLegalSourcesByScope("sc_ttd").length < 5) throw new Error("Base TTD/SC insuficiente.");
if (getLegalSourcesByScope("transition_2026").length < 2) throw new Error("Base da transição 2026 insuficiente.");

const consultation = getLegalSource("SC-COPAT-010-2026");
if (!consultation || isPrimaryLaw(consultation)) throw new Error("Consulta administrativa não pode ser classificada como lei primária.");

const primary = getLegalSource("SC-DEC-2128-2009");
if (!primary || !isPrimaryLaw(primary)) throw new Error("Decreto estadual deve ser tratado como fonte primária.");

console.log(`OK: ${LEGAL_FOUNDATION_2026.length} fontes jurídicas catalogadas para 2026.`);
