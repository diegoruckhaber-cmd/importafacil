export const SC_AUDIT_SESSION_KEY = "importafacil-sc-operation-audit";

export type SCAuditSession = {
  savedAt: string;
  exchangeRate: number;
  freightUsd: number;
  insuranceUsd: number;
  items: unknown[];
  expenses: unknown[];
  calculation: unknown;
};

export function saveSCAuditSession(session: SCAuditSession): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SC_AUDIT_SESSION_KEY, JSON.stringify(session));
}

export function loadSCAuditSession(): SCAuditSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SC_AUDIT_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SCAuditSession;
  } catch {
    window.sessionStorage.removeItem(SC_AUDIT_SESSION_KEY);
    return null;
  }
}

export function clearSCAuditSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SC_AUDIT_SESSION_KEY);
}
