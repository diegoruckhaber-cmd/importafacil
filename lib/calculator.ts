import { calculateTributaryOperation } from "./tributary-engine";

export type SimulationInput = {
  quantity:number; fobUsd:number; fx:number; freightUsd:number; insuranceUsd:number;
  otherBrl:number; ii:number; ipi:number; pis:number; cofins:number; icms:number; margin:number;
};

export function calculate(s:SimulationInput) {
  const merchandise=s.quantity*s.fobUsd*s.fx;
  const freight=s.freightUsd*s.fx;
  const insurance=s.insuranceUsd*s.fx;
  const cif=merchandise+freight+insurance;
  const tax=calculateTributaryOperation({
    valorAduaneiro:cif,
    iiRate:s.ii,
    ipiRate:s.ipi,
    pisImportRate:s.pis,
    cofinsImportRate:s.cofins,
    icmsRate:s.icms,
    otherBrl:s.otherBrl,
  });
  const total=cif+s.otherBrl+tax.totalTributos;
  const unit=total/s.quantity;
  const salePrice=s.margin>=100 ? 0 : unit/(1-s.margin/100);
  return {
    merchandise, freight, insurance, cif,
    ii:tax.ii.payable,
    ipi:tax.ipi.payable,
    pis:tax.pisImport.payable,
    cofins:tax.cofinsImport.payable,
    icms:tax.icms.payable,
    other:s.otherBrl, total, unit, salePrice,
    estimatedProfit:(salePrice*s.quantity)-total
  };
}
