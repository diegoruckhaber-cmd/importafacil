import { NextResponse } from "next/server";
import { compareImportScenarios, type ImportScenarioInput } from "../../../lib/import-scenario-comparator.ts";
import { buildScenarioLegalMemory } from "../../../lib/import-scenario-legal-memory.ts";

export async function POST(request: Request) {
  try {
    const input = await request.json() as ImportScenarioInput;
    if (!input.ncm || !/^\d{8}$/.test(input.ncm.replace(/\D/g, ""))) {
      return NextResponse.json({ error: "NCM deve conter 8 dígitos." }, { status: 400 });
    }
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
    }
    if (!Number.isFinite(input.exchangeRate) || input.exchangeRate <= 0) {
      return NextResponse.json({ error: "Câmbio inválido." }, { status: 400 });
    }

    const scenarios = compareImportScenarios({ ...input, ncm: input.ncm.replace(/\D/g, "") });
    return NextResponse.json({
      scenarios: scenarios.map((scenario) => ({
        ...scenario,
        legalMemory: buildScenarioLegalMemory(scenario),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível comparar os cenários." },
      { status: 400 },
    );
  }
}
