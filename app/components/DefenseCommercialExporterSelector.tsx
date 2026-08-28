"use client";

import { useEffect, useState } from "react";

type Option = { exporter: string; rate: number; unit: string; collectionSuspended?: boolean };

type Props = {
  ncm: string;
  origin: string;
  date: string;
  value: string;
  onChange: (value: string) => void;
};

const unitLabel = (unit: string) => {
  if (unit === "USD_PER_KG") return "US$/kg";
  if (unit === "USD_PER_TON") return "US$/t";
  if (unit === "USD_PER_PAIR") return "US$/par";
  if (unit === "USD_PER_UNIT") return "US$/unidade";
  if (unit === "USD_PER_THOUSAND_UNITS") return "US$/mil unidades";
  if (unit === "AD_VALOREM") return "%";
  return unit;
};

const isResidual = (exporter: string) => /demais|todas as empresas|todos os produtores/i.test(exporter);

export default function DefenseCommercialExporterSelector({ ncm, origin, date, value, onChange }: Props) {
  const [options, setOptions] = useState<Option[]>([]);
  const [applicable, setApplicable] = useState(false);

  useEffect(() => {
    const normalizedNcm = ncm.replace(/\D/g, "");
    if (normalizedNcm.length !== 8 || !origin.trim()) {
      setOptions([]);
      setApplicable(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/defesa-comercial-options?ncm=${encodeURIComponent(normalizedNcm)}&origin=${encodeURIComponent(origin)}&date=${encodeURIComponent(date)}`, { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        const next = Array.isArray(data.options) ? data.options : [];
        setOptions(next);
        setApplicable(data.applicable === true);
        if (data.applicable === true && next.length > 0 && !value) {
          const residual = next.find((option: Option) => isResidual(option.exporter));
          onChange(residual?.exporter ?? next[0].exporter);
        }
        if (data.applicable !== true && value) onChange("");
      } catch {
        if (!controller.signal.aborted) {
          setOptions([]);
          setApplicable(false);
        }
      }
    }, 120);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [ncm, origin, date]);

  if (!applicable) {
    return <label>Produtor/exportador <span style={{fontWeight:400,fontSize:12}}>(opcional)</span><input value={value} onChange={e=>onChange(e.target.value)} placeholder="Usado quando a defesa comercial depende da empresa"/></label>;
  }

  return <label>Produtor/exportador <span style={{fontWeight:400,fontSize:12}}>(selecione para resolver a alíquota)</span><select value={value} onChange={e=>onChange(e.target.value)}><option value="">Selecionar produtor/exportador...</option>{options.map(option=><option key={`${option.exporter}-${option.rate}-${option.unit}`} value={option.exporter}>{`${option.exporter} — ${option.rate.toFixed(2)} ${unitLabel(option.unit)}${option.collectionSuspended ? " — cobrança suspensa" : ""}`}</option>)}</select><small style={{display:"block",marginTop:6,color:"#64748b"}}>Medida antidumping identificada para esta NCM/origem. A escolha determina automaticamente o direito aplicável.</small></label>;
}
