"use client";

import { useEffect } from "react";

type ParsedAlert = {
  standardRate: string;
  temporaryRate: string;
  validFrom: string;
  validTo: string;
  legalBasis: string;
  ncm: string;
};

const parseAlert = (text: string, ncm: string): ParsedAlert | null => {
  if (!/elevação temporária do II/i.test(text)) return null;
  const match = text.match(/Alíquota padrão:\s*([\d.,]+)%;\s*alíquota temporária:\s*([\d.,]+)%;\s*vigência de\s*(\d{4}-\d{2}-\d{2})\s*a\s*(\d{4}-\d{2}-\d{2})\.[\s\S]*?Fundamento:\s*([^\.]+)/i);
  if (!match) return null;
  return { standardRate: match[1], temporaryRate: match[2], validFrom: match[3], validTo: match[4], legalBasis: match[5].trim(), ncm };
};

const formatDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

export default function TemporaryIIAlertEnhancer() {
  useEffect(() => {
    let timer: number | undefined;
    const enhance = () => {
      const result = document.querySelector(".result");
      if (!result) return;
      if (result.querySelector("[data-temporary-ii-alert]")) return;
      const auditBoxes = Array.from(result.querySelectorAll(".auditBox"));
      const sourceBox = auditBoxes.find((box) => /elevação temporária do II/i.test(box.textContent || ""));
      if (!sourceBox) return;
      const input = document.querySelector<HTMLInputElement>('input[aria-label="NCM"]');
      const alert = parseAlert(sourceBox.textContent || "", input?.value || "");
      if (!alert) return;

      const card = document.createElement("section");
      card.setAttribute("data-temporary-ii-alert", "true");
      card.className = "temporaryIIAlert";
      card.setAttribute("role", "alert");
      card.innerHTML = `
        <div class="temporaryIIAlertIcon" aria-hidden="true">!</div>
        <div class="temporaryIIAlertBody">
          <div class="temporaryIIAlertEyebrow">ATENÇÃO TRIBUTÁRIA</div>
          <h4>II com elevação temporária</h4>
          <p class="temporaryIIAlertIntro">Foi identificada uma medida temporária que aumenta o Imposto de Importação para esta NCM.</p>
          <div class="temporaryIIAlertRates">
            <div><span>Alíquota padrão</span><strong>${alert.standardRate}%</strong></div>
            <div class="temporaryIIAlertArrow" aria-hidden="true">→</div>
            <div><span>Alíquota temporária</span><strong>${alert.temporaryRate}%</strong></div>
          </div>
          <div class="temporaryIIAlertMeta">
            <span><b>NCM</b> ${alert.ncm || "informada"}</span>
            <span><b>Vigência</b> ${formatDate(alert.validFrom)} a ${formatDate(alert.validTo)}</span>
          </div>
          <div class="temporaryIIAlertNote"><b>O cálculo permanece pela alíquota padrão (${alert.standardRate}%).</b> Valide a aplicação da medida antes do registro da declaração, inclusive eventual Ex ou quota.</div>
          <div class="temporaryIIAlertLegal">Fundamento: ${alert.legalBasis}</div>
        </div>`;
      sourceBox.parentElement?.insertBefore(card, sourceBox);
    };

    const schedule = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(enhance, 80);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return null;
}
