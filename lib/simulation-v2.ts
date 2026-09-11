import { resolveFederalTaxes, type FederalTaxResolution } from "./federal-tax-resolution.ts";
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
    attentionPoints: [...new Set(allIssues.map((issue) => issue.message))],
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
    const blocked = /bloquead|não passou na validação jurídica/i.test(message);
    const validation = /requer validação|condicional/i.test(message);
    if (blocked || validation) {
      const issue: SimulationV2Issue = {
        code: blocked ? "state_rule_blocked" : "state_rule_requires_input",
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
    const landedCostPerUnitBrl = quantity > 0 ? landedCostBrl / quantity : landedCostBrl;
    const margin = normalizeMargin(source?.targetMarginPercent, defaultMargin);
    const targetSalePricePerUnitBrl = landedCostPerUnitBrl / (1 - margin / 100);
    const targetRevenueBrl = targetSalePricePerUnitBrl * quantity;
    const estimatedProfitBrl = targetRevenueBrl - landedCostBrl;

    return {
      ...row,
      status: statusFromIssues(normalizedItemIssues),
      commercial: {
        targetMarginPercent: margin,
        breakEvenPricePerUnitBrl: landedCostPerUnitBrl,
        targetSalePricePerUnitBrl,
        targetRevenueBrl,
        estimatedProfitBrl,
        note: "Preço de equilíbrio e margem calculados sobre o custo nacionalizado da importação, antes dos tributos e efeitos da venda.",
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

  return {
    contract: "importafacil-simulation-v2" as const,
    engine: core.engine,
    federalEngine: core.federalEngine,
    status: statusFromIssues(normalizedIssues, core.calculation?.status === "blocked" ? "blocked" : "calculated"),
    operation: {
      ...core.operation,
      scenarioName: String(input.scenarioName ?? "Simulação V2"),
      targetMarginPercent: defaultMargin,
    },
    summary: {
      merchandiseBrl: totalMerchandiseBrl,
      customsValueBrl: Number(core.calculation?.totalCustomsValue ?? 0),
      importTaxesBrl: Number(core.calculation?.totalBenefitTaxes ?? 0),
      defenseCommercialBrl: Number(core.calculation?.defenseCommercialBrl ?? 0),
      icmsImportSavingsBrl: Number(core.calculation?.totalImportICMSSavings ?? 0),
      landedCostBrl,
      capitalRequiredBrl: landedCostBrl,
      targetRevenueBrl,
      estimatedProfitBrl,
    },
    items: resultItems,
    calculation: core.calculation,
    issues: normalizedIssues,
    attentionPoints: [...new Set(normalizedIssues.map((issue) => issue.message))],
  };
}
