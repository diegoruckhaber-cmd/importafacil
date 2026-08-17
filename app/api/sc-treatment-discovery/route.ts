import { NextResponse } from "next/server";
import { discoverScTreatments } from "../../../lib/sc-treatment-discovery";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const ncm = params.get("ncm") ?? "";
  const destination = params.get("destination") ?? "commercial_resale";
  const origin = (params.get("origin") ?? "").trim();
  const candidates = discoverScTreatments({ ncm, destination, origin });

  return NextResponse.json({
    ncm: ncm.replace(/\D/g, ""),
    destination,
    origin: origin || null,
    candidates,
    disclaimer: "Descoberta automática é triagem. A aplicação do benefício depende da validação das condições e evidências da regra.",
  }, { headers: { "Cache-Control": "no-store" } });
}
