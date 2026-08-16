import { NextResponse } from "next/server";
import { decideSCItem } from "../../../lib/sc-decision-engine";
import { calculateTTD409410Benefit } from "../../../lib/sc-ttd409-410-benefit-calculator";

function num(value: unknown, label: string, allowZero = true) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (!allowZero && parsed <= 0) || (allowZero && parsed < 0)) {
    throw new Error(`${label} inválido.`);
  }
  return parsed;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ttd = Number(body.ttd);
    if (ttd !== 409 && ttd !== 410) {
      throw new Error("Este cálculo de saída está disponível, nesta etapa, para TTD 409 e TTD 410.");
    }

    const destination = body.destination === "industrialization" ? "industrialization" : "commercial_resale";
    const operation = body.operation === "interstate" ? "interstate" : "internal";
    const aliquotaPercent = num(body.aliquotaPercent, "Alíquota de ICMS", false);
    if (aliquotaPercent >= 100) throw new Error("A alíquota de ICMS deve ser inferior a 100%.");

    const outputValue = num(body.outputValue, "Valor da saída", false);
    const validConcession = body.validConcession === true;
    const importEntryInSC = body.importEntryInSC === true;
    const sameNcmPosition = body.sameNcmPositionAfterFractionation !== false;
    const industrializationInSC = destination === "industrialization" && body.industrializationInSC === true;
    const productClass = body.productClass === "steel_copper_coke_aluminum_silver"
      ? "steel_copper_coke_aluminum_silver"
      : "other";
    const continuousTTDMonths = num(body.continuousTTDMonths ?? 0, "Meses contínuos de TTD");
    const annualQualifiedOutputBrl = num(body.annualQualifiedOutputBrl ?? 0, "Saída anual qualificada");
    const requiredAnnualThresholdBrl = num(body.requiredAnnualThresholdBrl ?? 280_000_000, "Limite anual");
    const authorizedEarlyFullBenefit = body.authorizedEarlyFullBenefit === true;

    const decision = decideSCItem({
      id: "OUTPUT",
      ttd,
      destination,
      validConcession,
      importEntryInSC,
      decree2128Prohibited: body.decree2128Prohibited === true,
      sameNcmPositionAfterFractionation: sameNcmPosition,
    });

    if (decision.decision === "deny") {
      return NextResponse.json({
        status: "denied",
        decision,
        benefit: null,
        error: `TTD ${ttd} bloqueado: ${decision.reasons.join(" ")}`,
      }, { status: 200 });
    }

    if (decision.decision !== "apply") {
      return NextResponse.json({
        status: "conditional",
        decision,
        benefit: null,
        warnings: ["A elegibilidade jurídica do TTD ainda não está confirmada; nenhum crédito presumido foi calculado."],
      }, { status: 200 });
    }

    const benefit = calculateTTD409410Benefit({
      outputTaxBase: outputValue,
      normalOutputICMS: outputValue * aliquotaPercent / 100,
      destination,
      operation,
      aliquotaPercent,
      productClass,
      continuousTTDMonths,
      authorizedEarlyFullBenefit,
      annualQualifiedOutputBrl,
      requiredAnnualThresholdBrl,
      sameNcmPosition,
      originalCharacteristicsMaintained: sameNcmPosition,
      industrializationInSC,
    });

    return NextResponse.json({
      status: benefit.status,
      decision,
      benefit,
      audit: {
        ttd,
        destination,
        operation,
        outputValue,
        aliquotaPercent,
        normalOutputICMS: benefit.normalOutputICMS,
        targetOutputICMS: benefit.targetOutputICMS,
        presumedCreditAmount: benefit.presumedCreditAmount,
        targetTaxLoadPercent: benefit.targetTaxLoadPercent,
        presumedCreditPercentOfOutputICMS: benefit.presumedCreditPercentOfOutputICMS,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Não foi possível calcular a saída.",
    }, { status: 400 });
  }
}
