import { resolveFederalTaxes, type FederalTaxResolution } from "./federal-tax-resolution.ts";
import { analyzeImportTaxCredits2026, type CompanyTaxRegime, type GoodsApplication } from "./tax-profile.ts";
import {
  calculateUnifiedImportSimulation,
  type UnifiedImportItemInput,
  type UnifiedImportSimulationInput,
} from "./unified-import-simulation.ts";

export type SimulationV2Status = "calculated" | "alert" | "requires_input" | "blocked" | "unsupported";
export type SimulationV2IssueLevel = "warning" | "validation" | "blocking";

export type SimulationV2ItemInput = UnifiedImportItemInput & {
  targetMarginPercent?: number;
};

export type SimulationV2Input = Omit<UnifiedImportSimulationInput, "items"> & {
  scenarioName?: string;
  targetMarginPercent?: number;
  companyTaxRegime?: CompanyTaxRegime;
  icmsTaxpayer?: boolean;
  items: SimulationV2ItemInput[];
};

export type SimulationV2Issue = {
  code: string;
  level: SimulationV2IssueLevel;
  scope: "operation" | "item";
  itemId?: string;
  message: string;
};

const normalizeNcm = (value: string) => String(value ?? "").replace(/\D/g, "");

function normalizeMargin(value: number | undefined, fallback = 0) {
  const margin = value == null ? fallback : Number(value);
  if (!Number.isFinite(margin) || margin < 0 || margin >= 100) {
    throw new Error("Margem alvo deve ser maior ou igual a 0% e inferior a 100%.");
  }
  return margin;
}

function federalStatus(federal: FederalTaxResolution): SimulationV2Status {
  if (federal.ii.status === "not_found" || federal.ipi.status === "not_found") return "unsupported";
  if (federal.ii.status !== "resolved" || federal.ipi.status !== "resolved") return "requires_input";
  return federal.warnings.length ? "alert" : "calculated";
}

function uniqueIssues(issues: SimulationV2Issue[]) {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}|${issue.level}|${issue.scope}|${issue.itemId ?? ""}|${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function userFacingIssues(issues: SimulationV2Issue[]) {
  const normalized = uniqueIssues(issues);
  return normalized.filter((issue) => {
    if (issue.code === "federal_requires_input" && issue.itemId) {
      return !normalized.some((candidate) =>
        candidate !== issue &&
        candidate.itemId === issue.itemId &&
        candidate.level === "validation" &&
        candidate.code === "federal_attention"
      );
    }
    return true;
  });
}


function statusFromIssues(issues: SimulationV2Issue[], fallback: SimulationV2Status = "calculated"): SimulationV2Status {
  if (issues.some((issue) => issue.level === "blocking")) return "blocked";
  if (issues.some((issue) => issue.code === "federal_unsupported")) return "unsupported";
  if (issues.some((issue) => issue.level === "validation")) return "requires_input";
  if (issues.some((issue) => issue.level === "warning")) return "alert";
  return fallback;
}

function preflightFederal(input: SimulationV2Input) {
  return input.items.map((item, index) => {
    const itemId = String(item.itemId || `ITEM-${index + 1}`).trim() || `ITEM-${index + 1}`;
    const federal = resolveFederalTaxes({
      ncm: normalizeNcm(item.ncm),
      date: input.date,
      iiExCode: item.iiExCode,
      iiQuotaConfirmed: item.iiQuotaConfirmed,
      ipiExCode: item.ipiExCode,
      ipiBaseConfirmed: item.ipiBaseConfirmed,
      aeronauticalEligible: item.aeronauticalEligible,
    });
    const status = federalStatus(federal);
    const issues: SimulationV2Issue[] = [];

    if (status === "unsupported") {
      issues.push({
        code: "federal_unsupported",
        level: "validation",
        scope: "item",
        itemId,
        message: `${itemId}: II ou IPI não foi localizado no catálogo federal oficial para esta NCM.`,
      });
    } else if (status === "requires_input") {
      issues.push({
        code: "federal_requires_input",
        level: "validation",
        scope: "item",
        itemId,
        message: `${itemId}: o tratamento federal depende de informação adicional antes do cálculo.`,
      });
    }

    const warningLevel: SimulationV2IssueLevel = status === "requires_input" || status === "unsupported" ? "validation" : "warning";
    for (const warning of [...federal.ii.warnings, ...federal.ipi.warnings]) {
      issues.push({ code: "federal_attention", level: warningLevel, scope: "item", itemId, message: warning });
    }

    return { itemId, federal, status, issues };
  });
}

function baseOperation(input: SimulationV2Input) {
  return {
    scenarioName: String(input.scenarioName ?? "Simulação V2"),
    date: input.date,
    destinationUf: String(input.destinationUf ?? "SC").trim().toUpperCase(),
    exchange: Number(input.exchange),
    itemCount: input.items.length,
    freightUsd: Number(input.freight ?? 0),
    insuranceUsd: Number(input.insurance ?? 0),
    targetMarginPercent: normalizeMargin(input.targetMarginPercent, 0),
  };
}

function responseWithoutCalculation(
  input: SimulationV2Input,
  preflight: ReturnType<typeof preflightFederal>,
  issues: SimulationV2Issue[],
  forcedStatus?: SimulationV2Status,
) {
  const allIssues = uniqueIssues(issues);
  return {
    contract: "importafacil-simulation-v2" as const,
    engine: "unified-multi-item-v1" as const,
    status: forcedStatus ?? statusFromIssues(allIssues),
    operation: baseOperation(input),
    summary: null,
    items: preflight.map((entry, index) => ({
      itemId: entry.itemId,
      name: input.items[index]?.name ?? entry.itemId,
      ncm: normalizeNcm(input.items[index]?.ncm ?? ""),
      origin: input.items[index]?.origin ?? "",
      status: entry.status,
      federal: entry.federal,
      calculation: null,
      commercial: null,
      issues: entry.issues,
    })),
    calculation: null,
    issues: allIssues,
    attentionPoints: [...new Set(userFacingIssues(allIssues).map((issue) => issue.message))],
  };
}

export function runImportSimulationV2(input: SimulationV2Input) {
  if (!input || !Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("A Simulation V2 precisa ter pelo menos um item.");
  }

  const defaultMargin = normalizeMargin(input.targetMarginPercent, 0);
  input.items.forEach((item) => normalizeMargin(item.targetMarginPercent, defaultMargin));

  const preflight = preflightFederal(input);
  const preflightIssues = preflight.flatMap((entry) => entry.issues);
  const unresolved = preflight.filter((entry) => entry.status === "requires_input" || entry.status === "unsupported");
  if (unresolved.length) {
    const forcedStatus: SimulationV2Status = unresolved.some((entry) => entry.status === "unsupported") ? "unsupported" : "requires_input";
    return responseWithoutCalculation(input, preflight, preflightIssues, forcedStatus);
  }

  const coreInput: UnifiedImportSimulationInput = {
    date: input.date,
    destinationUf: input.destinationUf,
    exchange: input.exchange,
    freight: input.freight,
    insurance: input.insurance,
    storage: input.storage,
    otherBrl: input.otherBrl,
    storageAllocation: input.storageAllocation,
    otherAllocation: input.otherAllocation,
    transportMode: input.transportMode,
    declarationType: input.declarationType,
    additions: input.additions,
    expenses: input.expenses,
    items: input.items.map(({ targetMarginPercent: _margin, ...item }) => item),
  };

  let core: ReturnType<typeof calculateUnifiedImportSimulation>;
  try {
    core = calculateUnifiedImportSimulation(coreInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : "A operação não pôde ser calculada.";
    const itemId = message.match(/^([^:]+):/)?.[1];
    const jurisdictionUnsupported = /UF .*não homologada|motor estadual automático está homologado somente para SC/i.test(message);
    const stateScopeUnsupported = /homologada apenas para a regra geral de ICMS|benefícios e regimes especiais permanecem fora do escopo/i.test(message);
    const blocked = jurisdictionUnsupported || stateScopeUnsupported || /bloquead|não passou na validação jurídica/i.test(message);
    const validation = /requer validação|condicional/i.test(message);
    if (blocked || validation) {
      const issue: SimulationV2Issue = {
        code: jurisdictionUnsupported
          ? "state_jurisdiction_unsupported"
          : stateScopeUnsupported
            ? "state_scope_unsupported"
            : blocked
              ? "state_rule_blocked"
              : "state_rule_requires_input",
        level: blocked ? "blocking" : "validation",
        scope: itemId ? "item" : "operation",
        itemId,
        message,
      };
      return responseWithoutCalculation(input, preflight, [...preflightIssues, issue], blocked ? "blocked" : "requires_input");
    }
    throw error;
  }

  const issues: SimulationV2Issue[] = [...preflightIssues];
  const resultItems = core.items.map((row, index) => {
    const source = input.items[index];
    const itemIssues: SimulationV2Issue[] = [];
    const defense = row.federal?.defenseCommercial;
    const sc = row.sc;
    const calculation = row.calculation;

    if (defense?.status === "requires_input") {
      for (const warning of defense.warnings ?? []) {
        itemIssues.push({ code: "defense_commercial_requires_input", level: "validation", scope: "item", itemId: row.itemId, message: warning });
      }
    } else if (defense?.status === "identified") {
      for (const warning of defense.warnings ?? []) {
        itemIssues.push({ code: "defense_commercial_identified", level: "warning", scope: "item", itemId: row.itemId, message: warning });
      }
    }

    if (sc?.decision === "conditional" || sc?.benefitDecision === "conditional" || (sc?.blockingIssues?.length ?? 0) > 0) {
      const messages = [
        ...(sc?.blockingIssues ?? []),
        ...(sc?.decision === "conditional" ? sc.decisionReasons ?? [] : []),
        ...(sc?.benefitDecision === "conditional" ? sc.benefitReasons ?? [] : []),
      ];
      for (const message of messages) {
        itemIssues.push({ code: "state_rule_requires_input", level: "validation", scope: "item", itemId: row.itemId, message });
      }
    }

    for (const warning of row.federal?.warnings ?? []) {
      itemIssues.push({ code: "federal_attention", level: "warning", scope: "item", itemId: row.itemId, message: warning });
    }
    for (const warning of calculation?.warnings ?? []) {
      itemIssues.push({ code: "calculation_attention", level: "warning", scope: "item", itemId: row.itemId, message: warning });
    }

    const normalizedItemIssues = uniqueIssues(itemIssues);
    issues.push(...normalizedItemIssues);

    const landedCostBrl = Number(calculation?.landedCostIncludingDefense ?? 0);
    const quantity = Number(row.quantity ?? source?.quantity ?? 0);
    const creditAnalysis = analyzeImportTaxCredits2026({
      date: input.date,
      regime: input.companyTaxRegime ?? "nao-informado",
      application: (source?.destination ?? "commercial_resale") as GoodsApplication,
      icmsTaxpayer: input.icmsTaxpayer,
      taxes: {
        icms: Number(calculation?.taxLines?.icms?.payable ?? calculation?.taxLines?.icms?.value ?? 0),
        ipi: Number(calculation?.taxLines?.ipi?.payable ?? calculation?.taxLines?.ipi?.value ?? 0),
        pisImport: Number(calculation?.taxLines?.pisImport?.payable ?? calculation?.taxLines?.pisImport?.value ?? 0),
        cofinsImport: Number(calculation?.taxLines?.cofinsImport?.payable ?? calculation?.taxLines?.cofinsImport?.value ?? 0),
      },
    });
    const economicCostBrl = creditAnalysis.totalRecoverableCredits == null
      ? landedCostBrl
      : Math.max(0, landedCostBrl - creditAnalysis.totalRecoverableCredits);
    const economicCostPerUnitBrl = quantity > 0 ? economicCostBrl / quantity : economicCostBrl;
    const margin = normalizeMargin(source?.targetMarginPercent, defaultMargin);
    const targetSalePricePerUnitBrl = economicCostPerUnitBrl / (1 - margin / 100);
    const targetRevenueBrl = targetSalePricePerUnitBrl * quantity;
    const estimatedProfitBrl = targetRevenueBrl - economicCostBrl;

    return {
      ...row,
      status: statusFromIssues(normalizedItemIssues),
      creditAnalysis,
      commercial: {
        targetMarginPercent: margin,
        breakEvenPricePerUnitBrl: economicCostPerUnitBrl,
        grossImportCostPerUnitBrl: quantity > 0 ? landedCostBrl / quantity : landedCostBrl,
        economicNetCostBrl: creditAnalysis.totalRecoverableCredits == null ? null : economicCostBrl,
        targetSalePricePerUnitBrl,
        targetRevenueBrl,
        estimatedProfitBrl,
        note: creditAnalysis.totalRecoverableCredits == null
          ? "Preço de equilíbrio provisório calculado sobre o desembolso bruto porque os créditos tributários ainda exigem validação."
          : "Preço de equilíbrio calculado sobre o custo econômico líquido estimado, após créditos recuperáveis da importação e antes dos tributos e efeitos da venda.",
      },
      issues: normalizedItemIssues,
    };
  });

  if (core.calculation?.status === "conditional") {
    const warnings = core.calculation.warnings ?? [];
    if (!warnings.length) {
      issues.push({
        code: "operation_requires_input",
        level: "validation",
        scope: "operation",
        message: "A operação possui condição tributária pendente e requer validação antes de ser tratada como cálculo final.",
      });
    } else {
      for (const warning of warnings) {
        issues.push({ code: "operation_requires_input", level: "validation", scope: "operation", message: warning });
      }
    }
  } else if (core.calculation?.status === "blocked") {
    issues.push({ code: "operation_blocked", level: "blocking", scope: "operation", message: "O motor de custo marcou a operação como bloqueada." });
  }

  const normalizedIssues = uniqueIssues(issues);
  const targetRevenueBrl = resultItems.reduce((sum, item) => sum + item.commercial.targetRevenueBrl, 0);
  const landedCostBrl = Number(core.calculation?.totalLandedCostIncludingDefense ?? 0);
  const estimatedProfitBrl = targetRevenueBrl - landedCostBrl;
  const totalMerchandiseBrl = core.items.reduce((sum, item) => sum + Number(item.merchandiseValueBrl ?? 0), 0);
  const freightBrl = Number(core.operation?.freightUsd ?? input.freight ?? 0) * Number(core.operation?.exchange ?? input.exchange ?? 0);
  const insuranceBrl = Number(core.operation?.insuranceUsd ?? input.insurance ?? 0) * Number(core.operation?.exchange ?? input.exchange ?? 0);
  const afrmmBrl = Number(core.operation?.importCharges?.afrmmBrl ?? 0);
  const siscomexBrl = Number(core.operation?.importCharges?.siscomexBrl ?? 0);
  const storageBrl = Number(input.storage ?? 0);
  const otherExpensesBrl = Number(input.otherBrl ?? 0);
  const taxTotals = resultItems.reduce((acc, item) => {
    const lines = item.calculation?.taxLines;
    acc.iiBrl += Number(lines?.ii?.payable ?? lines?.ii?.value ?? 0);
    acc.ipiBrl += Number(lines?.ipi?.payable ?? lines?.ipi?.value ?? 0);
    acc.pisImportBrl += Number(lines?.pisImport?.payable ?? lines?.pisImport?.value ?? 0);
    acc.cofinsImportBrl += Number(lines?.cofinsImport?.payable ?? lines?.cofinsImport?.value ?? 0);
    acc.icmsImportBrl += Number(lines?.icms?.payable ?? lines?.icms?.value ?? 0);
    return acc;
  }, { iiBrl: 0, ipiBrl: 0, pisImportBrl: 0, cofinsImportBrl: 0, icmsImportBrl: 0 });
  const creditTotals = resultItems.reduce((acc, item) => {
    const credit = item.creditAnalysis;
    acc.icmsCreditBrl += Number(credit?.icmsCredit ?? 0);
    acc.ipiCreditBrl += Number(credit?.ipiCredit ?? 0);
    acc.pisImportCreditBrl += Number(credit?.pisImportCredit ?? 0);
    acc.cofinsImportCreditBrl += Number(credit?.cofinsImportCredit ?? 0);
    if (credit?.totalRecoverableCredits == null) acc.complete = false;
    return acc;
  }, { icmsCreditBrl: 0, ipiCreditBrl: 0, pisImportCreditBrl: 0, cofinsImportCreditBrl: 0, complete: true });
  const totalRecoverableCreditsBrl = creditTotals.complete
    ? creditTotals.icmsCreditBrl + creditTotals.ipiCreditBrl + creditTotals.pisImportCreditBrl + creditTotals.cofinsImportCreditBrl
    : null;
  const economicNetCostBrl = totalRecoverableCreditsBrl == null ? null : Math.max(0, landedCostBrl - totalRecoverableCreditsBrl);

  return {
    contract: "importafacil-simulation-v2" as const,
    engine: core.engine,
    federalEngine: core.federalEngine,
    jurisdiction: core.jurisdiction,
    status: statusFromIssues(normalizedIssues, core.calculation?.status === "blocked" ? "blocked" : "calculated"),
    operation: {
      ...core.operation,
      scenarioName: String(input.scenarioName ?? "Simulação V2"),
      targetMarginPercent: defaultMargin,
      companyTaxRegime: input.companyTaxRegime ?? "nao-informado",
      icmsTaxpayer: input.icmsTaxpayer,
    },
    summary: {
      merchandiseBrl: totalMerchandiseBrl,
      customsValueBrl: Number(core.calculation?.totalCustomsValue ?? 0),
      importTaxesBrl: Number(core.calculation?.totalBenefitTaxes ?? 0),
      defenseCommercialBrl: Number(core.calculation?.defenseCommercialBrl ?? 0),
      icmsImportSavingsBrl: Number(core.calculation?.totalImportICMSSavings ?? 0),
      landedCostBrl,
      grossDisbursementBrl: landedCostBrl,
      capitalRequiredBrl: landedCostBrl,
      freightBrl,
      insuranceBrl,
      afrmmBrl,
      siscomexBrl,
      customsChargesBrl: afrmmBrl + siscomexBrl,
      storageBrl,
      otherExpensesBrl,
      logisticsAndExpensesBrl: freightBrl + insuranceBrl + storageBrl + otherExpensesBrl,
      iiBrl: taxTotals.iiBrl,
      ipiBrl: taxTotals.ipiBrl,
      pisImportBrl: taxTotals.pisImportBrl,
      cofinsImportBrl: taxTotals.cofinsImportBrl,
      icmsImportBrl: taxTotals.icmsImportBrl,
      economicNetCostBrl,
      recoverableTaxCreditsBrl: totalRecoverableCreditsBrl,
      icmsCreditBrl: creditTotals.icmsCreditBrl,
      ipiCreditBrl: creditTotals.ipiCreditBrl,
      pisImportCreditBrl: creditTotals.pisImportCreditBrl,
      cofinsImportCreditBrl: creditTotals.cofinsImportCreditBrl,
      economicCostStatus: economicNetCostBrl == null ? "requires_tax_profile_validation" as const : "calculated" as const,
      targetRevenueBrl,
      estimatedProfitBrl,
    },
    items: resultItems,
    calculation: core.calculation,
    issues: normalizedIssues,
    attentionPoints: [...new Set(userFacingIssues(normalizedIssues).map((issue) => issue.message))],
  };
}
