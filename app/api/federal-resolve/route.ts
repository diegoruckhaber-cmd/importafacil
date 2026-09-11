import { NextResponse } from "next/server";
import { resolveFederalTaxes } from "../../../lib/federal-tax-resolution";

function triState(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ncm = (url.searchParams.get("ncm") ?? "").replace(/\D/g, "");
    const date = url.searchParams.get("date") ?? "2026-09-08";

    if (ncm.length !== 8) {
      return NextResponse.json({ error: "Informe uma NCM válida com 8 dígitos." }, { status: 400 });
    }

    const result = resolveFederalTaxes({
      ncm,
      date,
      iiExCode: url.searchParams.get("iiExCode") || undefined,
      iiQuotaConfirmed: triState(url.searchParams.get("iiQuotaConfirmed")),
      ipiExCode: url.searchParams.get("ipiExCode") || undefined,
      aeronauticalEligible: triState(url.searchParams.get("aeronauticalEligible")),
    });

    return NextResponse.json({ ...result, date }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      error: "Não foi possível resolver os tributos federais.",
      detail: error instanceof Error ? error.message : "erro desconhecido",
    }, { status: 500 });
  }
}
