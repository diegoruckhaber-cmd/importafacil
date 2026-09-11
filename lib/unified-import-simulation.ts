import { calculateSCMultiItemFinalCost } from "./sc-multi-item-final-cost-engine.ts";
import { decideSCItem } from "./sc-decision-engine.ts";
import { resolveSCBenefit, type SCBenefitResolution } from "./sc-benefit-resolution.ts";
import { resolveFederalTaxes } from "./federal-tax-resolution.ts";
import { resolveDefenseCommercial } from "./defesa-comercial-resolver.ts";
import { resolveSCImportAdditionalCharges, type ImportDeclarationType, type ImportTransportMode } from "./sc-import-additional-charges.ts";
import type { ItemImportExpense } from "./item-tributary-expense-engine.ts";
import type { CostAllocationMethod } from "./import-cost-allocation.ts";

export type UnifiedImportItemInput = {
  itemId: string;
  name?: string;
  ncm: string;
  origin: string;
  quantity: number;
  weightKg?: number;
  volumeM3?: number;
  fobUnit: number;
  icms: number;
  exporter?: string;
  iiExCode?: string;
  iiQuotaConfirmed?: boolean;
  ipiExCode?: string;
  aeronauticalEligible?: boolean;
  ttd?: "none" | "77" | "409" | "410";
  destination?: "commercial_resale" | "industrialization";
  validConcession?: boolean;
  importEntryInSC?: boolean;
  industrializationInSC?: boolean;
  sameNcmPositionAfterFractionation?: boolean;
  decree2128Prohibited?: boolean;
  specialRegimeIds?: string[];
  specialRegimeContext?: Record<string, unknown>;
};

export type UnifiedImportExpenseInput = {
  id: string;
  description: string;
  amount: number;
  treatment: ItemImportExpense["treatment"];
  allocation?: CostAllocationMethod;
  itemId?: string;
  note?: string;
};

export type UnifiedImportSimulationInput = {
  date: string;
  exchange: number;
  destinationUf?: string;
  freight?: number;
  insurance?: number;
  storage?: number;
  otherBrl?: number;
  storageAllocation?: CostAllocationMethod;
  otherAllocation?: CostAllocationMethod;
  transportMode?: ImportTransportMode;
  declarationType?: ImportDeclarationType;
  additions?: number;
  items: UnifiedImportItemInput[];
  expenses?: UnifiedImportExpenseInput[];
};

const HOMOLOGATED_STATE_UFS = ["SC"] as const;
const normalizeNcm = (value: string) => String(value ?? "").replace(/\D/g, "");
const normalizeUf = (value: string | undefined) => String(value ?? "SC").trim().toUpperCase();

function requireFinite(label: string, value: number, options?: { positive?: boolean; maxExclusive?: number }) {
  if (!Number.isFinite(value) || value < 0 || (options?.positive && value <= 0)) throw new Error(`${label} inválido.`);
  if (options?.maxExclusive != null && value >= options.maxExclusive) throw new Error(`${label} deve ser inferior a ${options.maxExclusive}.`);
}

function normalizeExpense(expense: UnifiedImportExpenseInput): ItemImportExpense | null {
  requireFinite(`Despesa ${expense.id}`, Number(expense.amount));
  if (Number(expense.amount) === 0) return null;
  return { id: expense.id, description: expense.description, amount: Number(expense.amount), treatment: expense.treatment, allocation: expense.allocation, itemId: expense.itemId, note: expense.note };
}

function assertFederalResolved(itemId: string, federal: ReturnType<typeof resolveFederalTaxes>) {
  if (federal.ii.status === "resolved" && federal.ipi.status === "resolved" && federal.iiRate != null && federal.ipiRate != null) return;
  const details = [...federal.ii.warnings, ...federal.ipi.warnings].filter(Boolean).join(" ");
  throw new Error(`${itemId}: tratamento federal requer validação antes do cálculo.${details ? ` ${details}` : ""}`);
}

function assertHomologatedJurisdiction(destinationUf: string) {
  if ((HOMOLOGATED_STATE_UFS as readonly string[]).includes(destinationUf)) return;
  throw new Error(`UF ${destinationUf || "não informada"} não homologada para cálculo estadual. Nesta versão, o motor estadual automático está homologado somente para SC.`);
}

export function calculateUnifiedImportSimulation(input: UnifiedImportSimulationInput) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(input.date ?? ""))) throw new Error("Informe uma data de importação válida.");
  const destinationUf = normalizeUf(input.destinationUf);
  if (!/^[A-Z]{2}$/.test(destinationUf)) throw new Error("Informe uma UF válida com 2 letras.");
  assertHomologatedJurisdiction(destinationUf);
  requireFinite("Câmbio", Number(input.exchange), { positive: true });
  requireFinite("Frete", Number(input.freight ?? 0));
  requireFinite("Seguro", Number(input.insurance ?? 0));
  requireFinite("Armazenagem", Number(input.storage ?? 0));
  requireFinite("Outras despesas", Number(input.otherBrl ?? 0));
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error("A operação precisa ter pelo menos um item.");

  const ids = new Set<string>();
  const normalizedItems = input.items.map((item, index) => {
    const itemId = String(item.itemId || `ITEM-${index + 1}`).trim();
    if (!itemId || ids.has(itemId)) throw new Error(`itemId inválido ou duplicado: ${itemId || "vazio"}`);
    ids.add(itemId);
    const ncm = normalizeNcm(item.ncm);
    if (ncm.length !== 8) throw new Error(`${itemId}: informe uma NCM válida com 8 dígitos.`);
    requireFinite(`${itemId}: Quantidade`, Number(item.quantity), { positive: true });
    requireFinite(`${itemId}: Peso líquido`, Number(item.weightKg ?? 0));
    requireFinite(`${itemId}: Volume`, Number(item.volumeM3 ?? 0));
    requireFinite(`${itemId}: FOB unitário`, Number(item.fobUnit));
    requireFinite(`${itemId}: ICMS`, Number(item.icms), { maxExclusive: 100 });
    return { ...item, itemId, ncm, origin: String(item.origin ?? "").trim(), quantity: Number(item.quantity), weightKg: Number(item.weightKg ?? 0), volumeM3: Number(item.volumeM3 ?? 0), fobUnit: Number(item.fobUnit), icms: Number(item.icms), ttd: item.ttd ?? "none", destination: item.destination ?? "commercial_resale" };
  });

  const exchange = Number(input.exchange);
  const freightBrl = Number(input.freight ?? 0) * exchange;
  const insuranceBrl = Number(input.insurance ?? 0) * exchange;
  const merchandiseValues = normalizedItems.map((item) => item.quantity * item.fobUnit * exchange);
  const totalMerchandiseValue = merchandiseValues.reduce((sum, value) => sum + value, 0);
  const totalWeightKg = normalizedItems.reduce((sum, item) => sum + item.weightKg, 0);
  if (insuranceBrl > 0 && totalMerchandiseValue <= 0) throw new Error("O valor FOB total das mercadorias deve ser positivo para ratear o seguro internacional.");
  if (freightBrl > 0 && totalWeightKg <= 0) throw new Error("O peso líquido total deve ser positivo para ratear o frete internacional.");

  const additionalCharges = resolveSCImportAdditionalCharges({ freightBrl, transportMode: input.transportMode ?? "not_informed", declarationType: input.declarationType ?? "di", additions: Math.max(1, Math.floor(Number(input.additions ?? normalizedItems.length))) });
  const benefitsByItem: Record<string, SCBenefitResolution> = {};
  const itemResolutions = normalizedItems.map((item, index) => {
    const federal = resolveFederalTaxes({ ncm: item.ncm, date: input.date, iiExCode: item.iiExCode, iiQuotaConfirmed: item.iiQuotaConfirmed, ipiExCode: item.ipiExCode, aeronauticalEligible: item.aeronauticalEligible });
    assertFederalResolved(item.itemId, federal);

    const merchandiseValueBrl = merchandiseValues[index];
    const freightShare = freightBrl > 0 ? item.weightKg / totalWeightKg : 0;
    const insuranceShare = insuranceBrl > 0 ? merchandiseValueBrl / totalMerchandiseValue : 0;
    const allocatedFreightBrl = freightBrl * freightShare;
    const allocatedInsuranceBrl = insuranceBrl * insuranceShare;
    const defense = resolveDefenseCommercial({ ncm: item.ncm, origin: item.origin, importDate: input.date, weightKg: item.weightKg > 0 ? item.weightKg : undefined, quantity: item.quantity, exporter: item.exporter || undefined, exchangeRate: exchange, customsValueBrl: merchandiseValueBrl + allocatedFreightBrl + allocatedInsuranceBrl });

    const specialRegimeIds = Array.isArray(item.specialRegimeIds) ? item.specialRegimeIds : [];
    const specialRegimeContext = item.specialRegimeContext && typeof item.specialRegimeContext === "object" ? item.specialRegimeContext : {};
    const usesTtd = ["77", "409", "410"].includes(item.ttd);
    let scDecision: ReturnType<typeof decideSCItem> | null = null;
    if (usesTtd || specialRegimeIds.length > 0) {
      scDecision = decideSCItem({ id: item.itemId, ttd: usesTtd ? Number(item.ttd) as 77 | 409 | 410 : undefined, destination: item.destination, validConcession: item.validConcession === true, importEntryInSC: item.importEntryInSC !== false, decree2128Prohibited: item.decree2128Prohibited === true, sameNcmPositionAfterFractionation: item.sameNcmPositionAfterFractionation !== false, specialRegimeIds, specialRegimeContext: { ...specialRegimeContext, product: { ...(specialRegimeContext.product as Record<string, unknown> | undefined), ncm: item.ncm } } });
      if (scDecision.decision === "deny") throw new Error(`${item.itemId}: regra SC bloqueada: ${scDecision.reasons.join(" ")}`);
    }

    if (usesTtd) {
      const benefit = resolveSCBenefit({ ttd: Number(item.ttd) as 77 | 409 | 410, destination: item.destination, ncm: item.ncm, normalOutputICMS: 0, taxableOutput: true, industrializationInSC: item.destination === "industrialization" && item.industrializationInSC === true, preservesOriginalCharacteristics: item.sameNcmPositionAfterFractionation !== false, sameNcmPosition: item.sameNcmPositionAfterFractionation !== false, otherDeferment: false, paragraph23Or24: false, equivalentTaxableEventElection: false });
      if (benefit.decision === "deny") throw new Error(`${item.itemId}: TTD ${item.ttd} não passou na validação jurídica: ${benefit.reasons.join(" ")}`);
      benefitsByItem[item.itemId] = benefit;
    }

    return { itemId: item.itemId, name: item.name ?? item.itemId, ncm: item.ncm, origin: item.origin, quantity: item.quantity, fobUnit: item.fobUnit, merchandiseValueBrl, allocatedFreightBrl, allocatedInsuranceBrl, federal: { ...federal, origin: item.origin, defenseCommercial: defense }, sc: { ttd: item.ttd, specialRegimeIds, decision: scDecision?.decision ?? "normal", decisionReasons: [...(scDecision?.reasons ?? ["Nenhum TTD/regime especial informado; tributação normal preservada."]), ...federal.warnings, ...additionalCharges.warnings, ...((defense.status === "requires_input" || defense.status === "identified") ? defense.warnings : [])], ruleIds: scDecision?.ruleIds ?? [], benefitDecision: benefitsByItem[item.itemId]?.decision ?? "normal", benefitReasons: benefitsByItem[item.itemId]?.reasons ?? [], blockingIssues: [...new Set([...(scDecision?.blockingIssues ?? []), ...(benefitsByItem[item.itemId]?.blockingIssues ?? [])])] }, defenseCommercialBrl: defense.amountBrl ?? 0 };
  });

  const expenses: ItemImportExpense[] = [];
  const addExpense = (expense: UnifiedImportExpenseInput) => { const normalized = normalizeExpense(expense); if (normalized) expenses.push(normalized); };
  addExpense({ id: "FREIGHT", description: "Frete internacional", amount: freightBrl, treatment: "customs_base", allocation: "weight" });
  addExpense({ id: "INSURANCE", description: "Seguro internacional", amount: insuranceBrl, treatment: "customs_base", allocation: "item_value" });
  addExpense({ id: "AFRMM", description: "AFRMM/TUM — base ICMS SC", amount: additionalCharges.afrmmBrl, treatment: "icms_import_base", allocation: "item_value", note: "8% sobre a remuneração do transporte aquaviário quando aplicável." });
  addExpense({ id: "SISCOMEX", description: "Taxa de Utilização do Siscomex — base ICMS SC", amount: additionalCharges.siscomexBrl, treatment: "icms_import_base", allocation: "item_value", note: "R$ 185 por DI + R$ 29,50 por adição." });
  addExpense({ id: "STORAGE", description: "Armazenagem", amount: Number(input.storage ?? 0), treatment: "operational_cost", allocation: input.storageAllocation ?? "item_value" });
  addExpense({ id: "OTHER", description: "Outras despesas", amount: Number(input.otherBrl ?? 0), treatment: "operational_cost", allocation: input.otherAllocation ?? "item_value" });
  for (const expense of input.expenses ?? []) addExpense(expense);

  const engineItems = normalizedItems.map((item, index) => { const federal = itemResolutions[index].federal; return { itemId: item.itemId, customsValue: merchandiseValues[index], quantity: item.quantity, weightKg: item.weightKg, volumeM3: item.volumeM3, iiRate: federal.iiRate!, ipiRate: federal.ipiRate!, pisImportRate: federal.pisImportRate, cofinsImportRate: federal.cofinsImportRate, icmsRate: item.icms, importDate: input.date as `${number}-${number}-${number}`, iiLegalFoundation: federal.ii.legalBasis ?? federal.ii.source ?? "MDIC Tarifas Vigentes" }; });
  const calculation = calculateSCMultiItemFinalCost({ items: engineItems, expenses, benefitsByItem });
  const resolutionById = new Map(itemResolutions.map((item) => [item.itemId, item]));
  const calculationItems = calculation.items.map((calculatedItem) => { const resolution = resolutionById.get(calculatedItem.itemId)!; const defenseCommercialBrl = resolution.defenseCommercialBrl; const landedCostIncludingDefense = calculatedItem.landedCostAfterBenefit + defenseCommercialBrl; return { ...calculatedItem, defenseCommercial: resolution.federal.defenseCommercial, defenseCommercialBrl, landedCostIncludingDefense, landedCostPerUnitIncludingDefense: resolution.quantity > 0 ? landedCostIncludingDefense / resolution.quantity : landedCostIncludingDefense }; });
  const defenseCommercialBrl = itemResolutions.reduce((sum, item) => sum + item.defenseCommercialBrl, 0);
  const totalLandedCostIncludingDefense = calculation.totalLandedCostAfterBenefit + defenseCommercialBrl;
  const items = itemResolutions.map((resolution) => ({ ...resolution, calculation: calculationItems.find((item) => item.itemId === resolution.itemId)! }));

  const response = {
    engine: "unified-multi-item-v1",
    federalEngine: "authoritative-federal-v2",
    jurisdiction: { destinationUf, stateEngine: "SC", status: "homologated", homologatedUfs: [...HOMOLOGATED_STATE_UFS] },
    operation: { date: input.date, destinationUf, exchange, freightUsd: Number(input.freight ?? 0), insuranceUsd: Number(input.insurance ?? 0), transportMode: input.transportMode ?? "not_informed", declarationType: input.declarationType ?? "di", itemCount: normalizedItems.length, importCharges: { afrmmRate: additionalCharges.afrmmRate * 100, afrmmBrl: additionalCharges.afrmmBrl, siscomexBrl: additionalCharges.siscomexBrl } },
    items,
    calculation: { ...calculation, items: calculationItems, defenseCommercialBrl, totalLandedCostIncludingDefense },
    warnings: [...new Set([...calculation.warnings, ...additionalCharges.warnings, ...itemResolutions.flatMap((item) => item.sc.decisionReasons)])],
  } as const;

  if (items.length === 1) return { ...response, federal: items[0].federal, sc: { ...items[0].sc, icmsNormalRate: items[0].calculation.icmsNormalRate, icmsImportEffectiveRate: items[0].calculation.icmsImportEffectiveRate, normalImportICMS: items[0].calculation.normalImportICMS, effectiveImportICMS: items[0].calculation.benefitImportICMS, importICMSSavings: items[0].calculation.importICMSSavings, importCharges: response.operation.importCharges } };
  return response;
}
