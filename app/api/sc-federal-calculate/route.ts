import { NextResponse } from "next/server";
import { calculateUnifiedImportSimulation, type UnifiedImportItemInput, type UnifiedImportSimulationInput } from "../../../lib/unified-import-simulation";

function itemFromUnknown(value: Record<string, unknown>, index: number): UnifiedImportItemInput {
  const rawTtd = String(value.ttd ?? "none");
  const rawDestination = String(value.destination ?? "commercial_resale");
  return {
    itemId: String(value.itemId ?? value.id ?? `ITEM-${index + 1}`),
    name: typeof value.name === "string" ? value.name : undefined,
    ncm: String(value.ncm ?? ""),
    origin: String(value.origin ?? ""),
    quantity: Number(value.quantity),
    weightKg: Number(value.weightKg ?? 0),
    volumeM3: Number(value.volumeM3 ?? 0),
    fobUnit: Number(value.fobUnit ?? value.unitFobUsd),
    icms: Number(value.icms ?? value.icmsRate),
    exporter: typeof value.exporter === "string" ? value.exporter : undefined,
    ttd: (["77", "409", "410"].includes(rawTtd) ? rawTtd : "none") as UnifiedImportItemInput["ttd"],
    destination: (rawDestination === "industrialization" ? "industrialization" : "commercial_resale"),
    validConcession: value.validConcession === true,
    importEntryInSC: value.importEntryInSC !== false,
    industrializationInSC: value.industrializationInSC === true,
    sameNcmPositionAfterFractionation: value.sameNcmPositionAfterFractionation !== false,
    decree2128Prohibited: value.decree2128Prohibited === true,
    specialRegimeIds: Array.isArray(value.specialRegimeIds) ? value.specialRegimeIds.filter((entry): entry is string => typeof entry === "string") : [],
    specialRegimeContext: value.specialRegimeContext && typeof value.specialRegimeContext === "object" ? value.specialRegimeContext as Record<string, unknown> : {},
  };
}

function normalizeRequest(body: Record<string, unknown>): UnifiedImportSimulationInput {
  const rawItems = Array.isArray(body.items) && body.items.length > 0
    ? body.items.filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === "object")
    : [{
        itemId: "ITEM-001",
        name: body.name,
        ncm: body.ncm,
        origin: body.origin,
        quantity: body.quantity,
        weightKg: body.weightKg,
        volumeM3: body.volumeM3,
        fobUnit: body.fobUnit,
        icms: body.icms,
        exporter: body.exporter,
        ttd: body.ttd,
        destination: body.destination,
        validConcession: body.validConcession,
        importEntryInSC: body.importEntryInSC,
        industrializationInSC: body.industrializationInSC,
        sameNcmPositionAfterFractionation: body.sameNcmPositionAfterFractionation,
        decree2128Prohibited: body.decree2128Prohibited,
        specialRegimeIds: body.specialRegimeIds,
        specialRegimeContext: body.specialRegimeContext,
      }];

  return {
    date: String(body.date ?? body.importDate ?? ""),
    exchange: Number(body.exchange ?? body.exchangeRate),
    freight: Number(body.freight ?? body.freightUsd ?? 0),
    insurance: Number(body.insurance ?? body.insuranceUsd ?? 0),
    storage: Number(body.storage ?? 0),
    otherBrl: Number(body.otherBrl ?? 0),
    storageAllocation: typeof body.storageAllocation === "string" ? body.storageAllocation as UnifiedImportSimulationInput["storageAllocation"] : undefined,
    otherAllocation: typeof body.otherAllocation === "string" ? body.otherAllocation as UnifiedImportSimulationInput["otherAllocation"] : undefined,
    transportMode: typeof body.transportMode === "string" ? body.transportMode as UnifiedImportSimulationInput["transportMode"] : "not_informed",
    declarationType: body.declarationType === "duimp" ? "duimp" : "di",
    additions: body.additions == null ? undefined : Number(body.additions),
    items: rawItems.map(itemFromUnknown),
    expenses: Array.isArray(body.expenses)
      ? body.expenses.filter((value): value is UnifiedImportSimulationInput["expenses"][number] => Boolean(value) && typeof value === "object")
      : [],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const result = calculateUnifiedImportSimulation(normalizeRequest(body));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível calcular a operação." }, { status: 400 });
  }
}
