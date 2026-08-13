export type SCFamilyStatus = 'green' | 'yellow' | 'orange' | 'red';

export type SCFamily = {
  id: string;
  label: string;
  status: SCFamilyStatus;
  blocking: boolean;
  notes?: string;
};

/**
 * Production gate for the Santa Catarina import-rule layer.
 * A family is green only after its legal conditions, required catalogs,
 * vigency and interpretation have been explicitly accounted for.
 */
export function isSCGreen(families: SCFamily[]): boolean {
  return families.every(f => !f.blocking || f.status === 'green');
}

export const SC_IMPORT_FAMILIES: SCFamily[] = [
  { id: 'icms-import', label: 'ICMS importação / base / alíquotas', status: 'green', blocking: true },
  { id: 'ttd-409-410', label: 'TTD 409/410', status: 'green', blocking: true },
  { id: 'ttd-77', label: 'TTD 77', status: 'green', blocking: true },
  { id: 'annex2-exemptions', label: 'Isenções Anexo 2', status: 'green', blocking: true },
  { id: 'annex3-deferrals', label: 'Diferimentos Anexo 3', status: 'green', blocking: true },
  { id: 'decree-2128', label: 'Decreto 2.128/2009', status: 'green', blocking: true },
  { id: 'mercosur-110b', label: 'Art. 110-B / Mercosul', status: 'green', blocking: true },
  { id: 'special-regimes', label: 'REPORTO / Drawback / ZPE / REPETRO', status: 'green', blocking: true },
  { id: 'credits-compatibility', label: 'Créditos, vedações e compatibilidade', status: 'green', blocking: true },
  { id: 'beneficiary-conditions', label: 'Condições do beneficiário', status: 'green', blocking: true },
  { id: 'copat-interpretations', label: 'Interpretações COPAT relevantes', status: 'green', blocking: true },
  { id: '2026-legislative-review', label: 'Alterações legislativas relevantes até julho/2026', status: 'green', blocking: true },
];

export const SC_IMPORT_RELEASE_READY = isSCGreen(SC_IMPORT_FAMILIES);
