import { compareSCBenefit } from "../lib/sc-benefit-effects.ts";

const normal = 26100;

const calculated = compareSCBenefit(normal, {
  kind: "presumed_credit",
  creditOnOutput: true,
  notes: ["Efeito financeiro calculado somente com parâmetros jurídicos previamente validados."],
}, 6500);

if (calculated.status !== "calculated" || calculated.estimatedSavings !== 19600) {
  throw new Error(`Falha no cenário calculado: ${JSON.stringify(calculated)}`);
}

const conditional = compareSCBenefit(normal, {
  kind: "conditional",
  notes: ["Falta parâmetro validado do benefício."],
});

if (conditional.status !== "conditional" || conditional.benefitICMS !== null) {
  throw new Error(`Falha no cenário condicional: ${JSON.stringify(conditional)}`);
}

console.log("SC benefit effects: PASS");
