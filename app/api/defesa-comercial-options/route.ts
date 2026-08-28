import { NextResponse } from "next/server";
import { listDefenseCommercialExporters } from "../../../lib/defesa-comercial-registry";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ncm = url.searchParams.get("ncm") ?? "";
  const origin = url.searchParams.get("origin") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const result = listDefenseCommercialExporters(ncm, origin, date);

  if (!result) return NextResponse.json({ applicable: false, options: [] }, { headers: { "Cache-Control": "no-store" } });

  return NextResponse.json({
    applicable: true,
    measure: {
      ncm: result.measure.ncm,
      product: result.measure.product,
      legalFoundation: result.measure.legalFoundation,
      source: result.measure.source,
      sourceUrl: (result.measure as typeof result.measure & { sourceUrl?: string }).sourceUrl,
      validityNote: result.measure.validityNote,
    },
    options: result.options,
  }, { headers: { "Cache-Control": "no-store" } });
}
