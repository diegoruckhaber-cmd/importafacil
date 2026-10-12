"use client";

import { useEffect, useState } from "react";

type Option = { exCode: string; rate: number | null; description: string; legalBasis: string };

type Props = {
  ncm: string;
  date: string;
  exCode: string;
  baseConfirmed: boolean;
  onChange: (value: { exCode: string; baseConfirmed: boolean }) => void;
};

export default function FederalIpiTreatmentSelector({ ncm, date, exCode, baseConfirmed, onChange }: Props) {
  const [options, setOptions] = useState<Option[]>([]);
  const [baseRate, setBaseRate] = useState<number | null>(null);
  const [applicable, setApplicable] = useState(false);

  useEffect(() => {
    const normalized = ncm.replace(/\D/g, "");
    if (normalized.length !== 8 || !date) {
      setOptions([]);
      setApplicable(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/federal-treatment-options?ncm=${encodeURIComponent(normalized)}&date=${encodeURIComponent(date)}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setOptions(Array.isArray(data.options) ? data.options : []);
        setBaseRate(typeof data.baseRate === "number" ? data.baseRate : null);
        setApplicable(data.applicable === true);
      } catch {
        if (!controller.signal.aborted) {
          setOptions([]);
          setApplicable(false);
        }
      }
    }, 120);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [ncm, date]);

  if (!applicable) {
    return (
      <label>
        EX do IPI <span style={{fontWeight:400,fontSize:12}}>(quando aplicável)</span>
        <input value={exCode} onChange={(e) => onChange({ exCode: e.target.value, baseConfirmed: false })} placeholder="Ex.: 001" />
      </label>
    );
  }

  const currentValue = baseConfirmed ? "__BASE__" : exCode || "";
  return (
    <label>
      Tratamento de IPI <span style={{fontWeight:400,fontSize:12}}>(selecione para concluir)</span>
      <select
        value={currentValue}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "__BASE__") onChange({ exCode: "", baseConfirmed: true });
          else onChange({ exCode: value, baseConfirmed: false });
        }}
      >
        <option value="">Selecione o enquadramento...</option>
        <option value="__BASE__">Regra geral da NCM{baseRate != null ? ` — ${baseRate.toLocaleString("pt-BR",{maximumFractionDigits:2})}%` : ""}</option>
        {options.map((option) => (
          <option key={option.exCode} value={option.exCode}>
            {`EX ${option.exCode}${typeof option.rate === "number" ? ` — ${option.rate.toLocaleString("pt-BR",{maximumFractionDigits:2})}%` : ""}${option.description ? ` — ${option.description}` : ""}`}
          </option>
        ))}
      </select>
      <small style={{display:"block",marginTop:6,color:"#64748b"}}>A TIPI possui EX para esta NCM. Escolha o EX correto ou confirme explicitamente a regra geral.</small>
    </label>
  );
}
