import { NextResponse } from "next/server";
import { resolveFederalTaxes } from "../../../lib/federal-tax-resolution";
import { isEuropeanUnionOrigin } from "../../../lib/mercosur-eu-import-preference";
import { listDefenseCommercialExporters } from "../../../lib/defesa-comercial-p0-registry";

type PreflightAlert = {
  code: string;
  level: "info" | "warning" | "critical";
  title: string;
  message: string;
  sourceUrl?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ncm = String(url.searchParams.get("ncm") ?? "").replace(/\D/g, "");
  const origin = String(url.searchParams.get("origin") ?? "").trim();
  const date = String(url.searchParams.get("date") ?? "");

  const alerts: PreflightAlert[] = [];
  if (ncm.length !== 8 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ alerts }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const federal = resolveFederalTaxes({ ncm, date });
    if (federal.ii.status === "requires_input") {
      alerts.push({
        code: "ii_requires_input",
        level: "warning",
        title: "Tratamento de II exige confirmação",
        message: federal.ii.warnings.join(" ") || "Esta NCM possui tratamento de II condicionado a informação adicional.",
        sourceUrl: federal.ii.sourceUrl,
      });
    } else {
      for (const warning of federal.ii.warnings) {
        alerts.push({
          code: "ii_attention",
          level: "info",
          title: "Atenção no Imposto de Importação",
          message: warning,
          sourceUrl: federal.ii.sourceUrl,
        });
      }
    }

    if (federal.ipi.status === "requires_input") {
      alerts.push({
        code: "ipi_requires_input",
        level: "warning",
        title: "Tratamento de IPI exige confirmação",
        message: federal.ipi.warnings.join(" ") || "Esta NCM possui tratamento de IPI condicionado a informação adicional.",
        sourceUrl: federal.ipi.sourceUrl,
      });
    }
  } catch {
    // Preflight is advisory; the official calculation keeps the fail-closed validation.
  }

  if (origin && date >= "2026-05-01" && isEuropeanUnionOrigin(origin)) {
    alerts.push({
      code: "mercosur_eu_preference",
      level: "info",
      title: "Possível preferência Mercosul-UE",
      message: "A origem informada pertence à União Europeia. Verifique a regra de origem, a prova de origem e a alíquota preferencial aplicável antes de concluir a simulação.",
      sourceUrl: "https://www.gov.br/siscomex/pt-br/acordos-comerciais/preferencias-tarifarias",
    });
  }

  if (origin) {
    try {
      const defense = listDefenseCommercialExporters(ncm, origin, date);
      if (defense) {
        const measure = defense.measure as typeof defense.measure & {
          product?: string;
          measure?: string;
          sourceUrl?: string;
          requiresScopeValidation?: boolean;
          scopeCondition?: string;
        };
        const label = measure.measure === "countervailing" ? "medida compensatória" : "medida antidumping";
        const needsExporter = Array.isArray(defense.options) && defense.options.length > 0;
        alerts.push({
          code: "defense_commercial",
          level: "critical",
          title: "Defesa comercial identificada",
          message: `Foi identificada ${label} para esta NCM/origem${measure.product ? ` (${measure.product})` : ""}.${measure.requiresScopeValidation ? ` A aplicação depende da validação do escopo: ${measure.scopeCondition || "consulte a fonte oficial"}.` : needsExporter ? " O produtor/exportador precisa ser confirmado para determinar o direito aplicável." : " Valide o tratamento antes do cálculo final."}`,
          sourceUrl: measure.sourceUrl,
        });
      }
    } catch {
      // Advisory lookup must not block editing.
    }
  }

  return NextResponse.json({ alerts }, { headers: { "Cache-Control": "no-store" } });
}
