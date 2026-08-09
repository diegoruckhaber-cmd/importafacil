export type SimulationInput = {
  quantity:number; fobUsd:number; fx:number; freightUsd:number; insuranceUsd:number;
  otherBrl:number; ii:number; ipi:number; pis:number; cofins:number; icms:number; margin:number;
};

export function calculate(s:SimulationInput) {
  const merchandise=s.quantity*s.fobUsd*s.fx;
  const freight=s.freightUsd*s.fx;
  const insurance=s.insuranceUsd*s.fx;
  const cif=merchandise+freight+insurance;
  const ii=cif*s.ii/100;
  const ipi=(cif+ii)*s.ipi/100;
  const pis=cif*s.pis/100;
  const cofins=cif*s.cofins/100;
  const base=cif+ii+ipi+pis+cofins+s.otherBrl;
  const icms=s.icms>=100 ? 0 : base*(s.icms/100)/(1-s.icms/100);
  const total=base+icms;
  const unit=total/s.quantity;
  const salePrice=s.margin>=100 ? 0 : unit/(1-s.margin/100);
  return {
    merchandise, freight, insurance, cif, ii, ipi, pis, cofins, icms,
    other:s.otherBrl, total, unit, salePrice,
    estimatedProfit:(salePrice*s.quantity)-total
  };
}
