import { NextResponse } from "next/server";
import { listDefenseCommercialExporters } from "../../../lib/defesa-comercial-registry";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ncm = url.searchParams.get("ncm") ?? "";
  const origin = url.searchParams.get("origin") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const result = listDefenseCommercialExporters(ncm, origin, date);
  if (!result) return NextResponse.json({ applicable: false, options: [], requiresValidation: false }, { headers: { "Cache-Control": "no-store" } });
  const metadata = result.measure as typeof result.measure & { requiresScopeValidation?: boolean; scopeCondition?: string; scopeAmbiguous?: boolean };
  const requiresValidation = result.options.length === 0 || Boolean(metadata.requiresScopeValidation) || Boolean(metadata.scopeAmbiguous);
  return NextResponse.json({
    applicable: true,
    requiresValidation,
    requiresScopeValidation: Boolean(metadata.requiresScopeValidation),
    scopeCondition: metadata.scopeCondition ?? null,
    warning: metadata.requiresScopeValidation
      ? `A medida foi identificada, mas o enquadramento depende de condição específica do produto${metadata.scopeCondition ? `: ${metadata.scopeCondition}` : "."} O cálculo automático fica bloqueado até a validação do escopo.`
      : requiresValidation ? "Medida de defesa comercial identificada, mas o tratamento aplicável requer validação na fonte oficial antes de concluir o cálculo." : null,
    measure: { ncm: result.measure.ncm, product: result.measure.product, legalFoundation: result.measure.legalFoundation, source: result.measure.source, sourceUrl: (result.measure as typeof result.measure & { sourceUrl?: string }).sourceUrl, validityNote: result.measure.validityNote },
    options: result.options,
  }, { headers: { "Cache-Control": "no-store" } });
}
