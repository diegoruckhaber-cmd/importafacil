"use client";

import { useEffect, useState } from "react";

type Alert = {
  code: string;
  level: "info" | "warning" | "critical";
  title: string;
  message: string;
  sourceUrl?: string;
};

export default function ItemPreflightAlerts({ ncm, origin, date }: { ncm: string; origin: string; date: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const normalizedNcm = ncm.replace(/\D/g, "");
    if (normalizedNcm.length !== 8 || !date) {
      setAlerts([]);
      setChecking(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setChecking(true);
      try {
        const response = await fetch(
          `/api/item-preflight?ncm=${encodeURIComponent(normalizedNcm)}&origin=${encodeURIComponent(origin)}&date=${encodeURIComponent(date)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) throw new Error("preflight_failed");
        const data = await response.json();
        setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      } catch {
        if (!controller.signal.aborted) setAlerts([]);
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [ncm, origin, date]);

  if (!alerts.length && !checking) return null;

  return (
    <div className="itemPreflight" aria-live="polite">
      <div className="itemPreflightHeader">
        <div>
          <small>ANÁLISE AUTOMÁTICA</small>
          <b>{checking ? "Verificando tratamentos..." : `${alerts.length} tratamento(s) identificado(s) durante o preenchimento`}</b>
        </div>
        {checking && <span className="itemPreflightSpinner" aria-hidden="true" />}
      </div>
      {!checking && alerts.map((alert, index) => (
        <div key={`${alert.code}-${index}`} className={`itemPreflightAlert ${alert.level}`}>
          <span className="itemPreflightIcon" aria-hidden="true">{alert.level === "critical" ? "!" : alert.level === "warning" ? "△" : "i"}</span>
          <div>
            <b>{alert.title}</b>
            <p>{alert.message}</p>
            {alert.code === "defense_commercial" && <small>Abra “Opções avançadas e tratamentos específicos” para informar o produtor/exportador quando necessário.</small>}
          </div>
          {alert.sourceUrl && <a href={alert.sourceUrl} target="_blank" rel="noreferrer">Fonte oficial ↗</a>}
        </div>
      ))}
    </div>
  );
}
