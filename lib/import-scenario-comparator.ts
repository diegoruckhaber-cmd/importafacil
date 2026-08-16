import { calculateSCMultiItemFinalCost, type SCMultiItemFinalCostResult } from "./sc-multi-item-final-cost-engine.ts";
import { resolveSCBenefit, type SCBenefitResolution } from "./sc-benefit-resolution.ts";
import { analyzeImportTaxCredits, type TaxProfile } from "./tax-profile.ts";

export type ImportScenario = "normal" | "ttd409" | "ttd410" | "ttd77";
export type SaleType = "internal" | "interstate" | "not-informed";
export type ImportScenarioInput = {
  ncm:string; quantity:number; fobUnitUsd:number; exchangeRate:number; freightUsd:number; insuranceUsd:number; otherExpensesBrl:number;
  iiRate:number; ipiRate:number; pisImportRate:number; cofinsImportRate:number; icmsRate:number; importDate?:`${number}-${number}-${number}`;
  destination?:"commercial_resale"|"industrialization"|"same_holder_transfer"; industrializationInSC?:boolean; taxableOutput?:boolean;
  preservesOriginalCharacteristics?:boolean; sameNcmPosition?:boolean; exclusionKnown?:boolean; otherDeferment?:boolean;
  paragraph23Or24?:boolean; equivalentTaxableEventElection?:boolean;
  taxProfile?: TaxProfile;
  saleType?: SaleType;
  saleOriginUf?: string;
  saleDestinationUf?: string;
  outputIcmsRate?: number;
};
export type ImportScenarioResult = {
  scenario:ImportScenario; label:string; legallyEligible:boolean; decision:"apply"|"conditional"|"deny"|"normal";
  legalReasons:string[]; blockingIssues:string[]; source:string; normalImportICMS:number; effectiveImportICMS:number; importICMSSavings:number;
  landedCostBeforeBenefit:number; landedCostAfterBenefit:number; landedCostPerUnit:number; engineResult:SCMultiItemFinalCostResult;
  benefitResolution?:SCBenefitResolution;
  taxProfile?: TaxProfile;
  creditAnalysis?: ReturnType<typeof analyzeImportTaxCredits>;
  saleContext: { type: SaleType; originUf?: string; destinationUf?: string; outputIcmsRate?: number; outputTaxStatus: "available"|"requires-validation" };
};
const LABELS:Record<ImportScenario,string>={normal:"Regime normal",ttd409:"TTD 409",ttd410:"TTD 410",ttd77:"TTD 77"};
function buildItem(i:ImportScenarioInput){return {itemId:"comparison-item",customsValue:(i.quantity*i.fobUnitUsd+i.freightUsd+i.insuranceUsd)*i.exchangeRate,quantity:i.quantity,iiRate:i.iiRate,ipiRate:i.ipiRate,pisImportRate:i.pisImportRate,cofinsImportRate:i.cofinsImportRate,icmsRate:i.icmsRate,importDate:i.importDate};}
function buildSaleContext(input: ImportScenarioInput) {
  const type = input.saleType ?? (input.saleDestinationUf && input.saleOriginUf ? (input.saleDestinationUf.toUpperCase() === input.saleOriginUf.toUpperCase() ? "internal" : "interstate") : "not-informed");
  const outputTaxStatus = input.outputIcmsRate != null ? "available" : "requires-validation";
  return { type, originUf: input.saleOriginUf, destinationUf: input.saleDestinationUf, outputIcmsRate: input.outputIcmsRate, outputTaxStatus } as const;
}
export function compareImportScenario(input:ImportScenarioInput,scenario:ImportScenario):ImportScenarioResult{
  const item=buildItem(input);
  const expenses=[{id:"other-expenses",description:"Outras despesas",amount:input.otherExpensesBrl,treatment:"operational_cost" as const,allocation:"item_value" as const}];
  const base=calculateSCMultiItemFinalCost({items:[item],expenses});
  const saleContext=buildSaleContext(input);
  const taxProfile=input.taxProfile;
  const creditAnalysis=taxProfile ? analyzeImportTaxCredits({icms:base.items[0].normalImportICMS,pisImport:base.items[0].pisImport,cofinsImport:base.items[0].cofinsImport},taxProfile) : undefined;
  if(scenario==="normal"){
    const r=base.items[0];
    return {scenario,label:LABELS[scenario],legallyEligible:true,decision:"normal",legalReasons:["Sem benefício estadual selecionado; cálculo tributário normal preservado."],blockingIssues:[],source:"Motor tributário SC + Federal",normalImportICMS:r.normalImportICMS,effectiveImportICMS:r.normalImportICMS,importICMSSavings:0,landedCostBeforeBenefit:r.landedCostBeforeBenefit,landedCostAfterBenefit:r.landedCostBeforeBenefit,landedCostPerUnit:r.landedCostBeforeBenefit/input.quantity,engineResult:base,taxProfile,creditAnalysis,saleContext};
  }
  const ttd=Number(scenario.replace("ttd","")) as 77|409|410;
  const benefit=resolveSCBenefit({ttd,destination:input.destination??"commercial_resale",ncm:input.ncm,exclusionKnown:input.exclusionKnown,taxableOutput:input.taxableOutput,industrializationInSC:input.industrializationInSC,preservesOriginalCharacteristics:input.preservesOriginalCharacteristics,sameNcmPosition:input.sameNcmPosition,otherDeferment:input.otherDeferment,paragraph23Or24:input.paragraph23Or24,equivalentTaxableEventElection:input.equivalentTaxableEventElection,normalOutputICMS:input.outputIcmsRate??0});
  const engine=benefit.decision==="apply"?calculateSCMultiItemFinalCost({items:[item],expenses,benefitsByItem:{"comparison-item":benefit}}):base;
  const r=engine.items[0];
  const finalCreditAnalysis=taxProfile ? analyzeImportTaxCredits({icms:r.benefitImportICMS,pisImport:r.pisImport,cofinsImport:r.cofinsImport},taxProfile) : undefined;
  const legalReasons=[...benefit.reasons];
  if(saleContext.type!=="not-informed") legalReasons.push(`Saída considerada ${saleContext.type === "internal" ? "interna" : "interestadual"}${saleContext.destinationUf ? ` para ${saleContext.destinationUf.toUpperCase()}` : ""}.`);
  if(saleContext.outputTaxStatus==="requires-validation") legalReasons.push("A tributação da saída subsequente ainda requer validação específica; não foi incorporada ao custo de importação.");
  return {scenario,label:LABELS[scenario],legallyEligible:benefit.decision==="apply",decision:benefit.decision,legalReasons,blockingIssues:benefit.blockingIssues,source:benefit.source,normalImportICMS:r.normalImportICMS,effectiveImportICMS:r.benefitImportICMS,importICMSSavings:r.importICMSSavings,landedCostBeforeBenefit:r.landedCostBeforeBenefit,landedCostAfterBenefit:r.landedCostAfterBenefit,landedCostPerUnit:r.landedCostPerUnitAfterBenefit,engineResult:engine,benefitResolution:benefit,taxProfile,creditAnalysis:finalCreditAnalysis,saleContext};
}
export function compareImportScenarios(input:ImportScenarioInput){return (["normal","ttd409","ttd410","ttd77"] as ImportScenario[]).map(s=>compareImportScenario(input,s));}
