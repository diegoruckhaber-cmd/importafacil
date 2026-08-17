"use client";

import { useEffect, useMemo, useState } from "react";

type Rule = {
  id: string;
  title: string;
  legalBasis: string;
  status: "validated" | "conditional" | "requires_lookup";
  conditions: Array<{ field: string; operator: string; value?: unknown }>;
  treatment: { notes?: string[] };
};

type Candidate = {
  id: string;
  title: string;
  legalBasis: string;
  status: string;
  confidence: "high" | "medium";
  reasons: string[];
};

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
  context: Record<string, unknown>;
  onContextChange: (context: Record<string, unknown>) => void;
  ncm: string;
  destination: "commercial_resale" | "industrialization";
  origin?: string;
};

const readPath = (obj: Record<string, unknown>, path: string) => path.split(".").reduce<unknown>((v, key) => (v && typeof v === "object" ? (v as Record<string, unknown>)[key] : undefined), obj);
const writePath = (obj: Record<string, unknown>, path: string, value: unknown) => {
  const next = structuredClone(obj);
  const keys = path.split(".");
  let cursor = next;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) cursor[key] = value;
    else {
      if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
      cursor = cursor[key] as Record<string, unknown>;
    }
  });
  return next;
};

function autoValue(field: string, ncm: string, destination: Props["destination"]) {
  if (field === "operation.kind") return "import_entry";
  if (field === "customs.entryState") return "SC";
  if (field === "purpose") return destination === "industrialization" ? "industrialization" : "resale";
  if (field === "industrializationState" && destination === "industrialization") return "SC";
  if (field === "product.ncm") return ncm;
  if (field === "specialRegime.art10") return true;
  if (field === "specialRegime.art10L") return true;
  return undefined;
}

export default function SpecialRegimeSelector({ selectedId, onSelect, context, onContextChange, ncm, destination, origin = "" }: Props) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/sc-special-regimes", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setRules(Array.isArray(data.regimes) ? data.regimes : []))
      .catch(() => setRules([]));
  }, []);

  useEffect(() => {
    if (ncm.replace(/\D/g, "").length !== 8) {
      setCandidates([]);
      return;
    }
    const controller = new AbortController();
    const query = new URLSearchParams({ ncm, destination, origin });
    fetch(`/api/sc-treatment-discovery?${query.toString()}`, { cache: "no-store", signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setCandidates(Array.isArray(data.candidates) ? data.candidates : []))
      .catch((error) => { if (error?.name !== "AbortError") setCandidates([]); });
    return () => controller.abort();
  }, [ncm, destination, origin]);

  const selected = useMemo(() => rules.find((rule) => rule.id === selectedId), [rules, selectedId]);

  useEffect(() => {
    if (!selected) return;
    let next = context;
    for (const condition of selected.conditions) {
      const value = autoValue(condition.field, ncm, destination);
      if (value !== undefined && readPath(next, condition.field) === undefined) next = writePath(next, condition.field, value);
    }
    if (next !== context) onContextChange(next);
  }, [selected, ncm, destination]);

  return (
    <div className="auditBox" style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h4 style={{ marginBottom: 4 }}>Descoberta de tratamentos SC</h4>
          <small>O sistema procura regimes que podem fazer sentido para a NCM e a destinação informadas.</small>
        </div>
        <button type="button" className="secondaryBtn" onClick={() => setOpen((v) => !v)}>{open ? "Fechar" : "Selecionar"}</button>
      </div>

      {candidates.length > 0 && (
        <div style={{ display: "grid", gap: 9, marginTop: 12 }}>
          <strong style={{ fontSize: 13 }}>Possíveis tratamentos encontrados</strong>
          {candidates.map((candidate) => (
            <button key={candidate.id} type="button" onClick={() => { onSelect(candidate.id); setOpen(true); }} style={{ textAlign: "left", padding: 12, borderRadius: 10, border: "1px solid #deded7", background: candidate.id === selectedId ? "#f0f0eb" : "white", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <strong>{candidate.title}</strong><small>{candidate.confidence === "high" ? "NCM exata" : "triagem"}</small>
              </div>
              <small>{candidate.legalBasis}</small>
              <div style={{ marginTop: 5, fontSize: 12 }}>{candidate.reasons.join(" ")}</div>
            </button>
          ))}
          <small>Triagem automática: nenhum benefício é aplicado só porque apareceu nesta lista.</small>
        </div>
      )}

      {selected && (
        <div className="notice" style={{ marginTop: 12 }}>
          <strong>{selected.title}</strong><br />
          <small>{selected.legalBasis} · {selected.status === "requires_lookup" ? "exige consulta específica" : "condicional"}</small>
        </div>
      )}

      {open && (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <label>Regra disponível
            <select value={selectedId} onChange={(e) => onSelect(e.target.value)}>
              <option value="">Nenhuma — usar TTD/tributação normal</option>
              {rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.title}</option>)}
            </select>
          </label>
        </div>
      )}

      {selected && selected.conditions.length > 0 && (
        <div className="checks" style={{ marginTop: 14 }}>
          <strong style={{ display: "block", marginBottom: 6 }}>Evidências da regra</strong>
          {selected.conditions.map((condition) => {
            const value = readPath(context, condition.field) ?? autoValue(condition.field, ncm, destination);
            const automatic = autoValue(condition.field, ncm, destination) !== undefined;
            if (condition.operator === "eq" && typeof condition.value === "boolean") {
              return <label key={condition.field}><input type="checkbox" checked={value === true} disabled={automatic} onChange={(e) => onContextChange(writePath(context, condition.field, e.target.checked))} /> {condition.field}{automatic ? " (inferido)" : ""}</label>;
            }
            return <label key={condition.field}>{condition.field}
              <input value={String(value ?? "")} disabled={automatic} onChange={(e) => onContextChange(writePath(context, condition.field, e.target.value))} />
            </label>;
          })}
        </div>
      )}
    </div>
  );
}
