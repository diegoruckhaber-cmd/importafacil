import { NextResponse } from "next/server";
import { resolveFederalTaxes } from "../../../lib/federal-tax-resolution";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ncm = String(url.searchParams.get("ncm") ?? "").replace(/\D/g, "");
  const date = String(url.searchParams.get("date") ?? "");
  if (ncm.length !== 8 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ applicable: false, options: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const federal = resolveFederalTaxes({ ncm, date });
    const candidates = Array.isArray(federal.ipi?.candidates) ? federal.ipi.candidates : [];
    const baseCandidates = candidates.filter((candidate) => !candidate.exCode);
    const exCandidates = candidates.filter((candidate) => Boolean(candidate.exCode));
    const baseRate = baseCandidates.find((candidate) => typeof candidate.rate === "number")?.rate ?? null;
    const options = exCandidates
      .filter((candidate) => candidate.exCode)
      .map((candidate) => ({
        exCode: String(candidate.exCode),
        rate: candidate.rate,
        description: candidate.description ?? "",
        legalBasis: candidate.legalBasis ?? "",
      }));

    return NextResponse.json({
      applicable: options.length > 0,
      baseRate,
      options,
      sourceUrl: federal.ipi?.sourceUrl ?? null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ applicable: false, options: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
