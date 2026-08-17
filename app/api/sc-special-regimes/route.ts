import { NextResponse } from "next/server";
import { SC_IMPORT_SPECIAL_REGIMES_2026 } from "../../../lib/sc-import-special-regimes";

export async function GET() {
  return NextResponse.json({
    effectiveFrom: "2026-01-01",
    count: SC_IMPORT_SPECIAL_REGIMES_2026.length,
    regimes: SC_IMPORT_SPECIAL_REGIMES_2026.map((rule) => ({
      id: rule.id,
      title: rule.title,
      legalBasis: rule.legalBasis,
      source: rule.source,
      effectiveFrom: rule.effectiveFrom,
      status: rule.status,
      conditions: rule.conditions,
      treatment: rule.treatment,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
