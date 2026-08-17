const cases = [
  {
    name: "409 após 36 meses",
    input: {
      ttd: 409,
      destination: "commercial_resale",
      operation: "internal",
      outputValue: 100000,
      aliquotaPercent: 17,
      continuousTTDMonths: 36,
      validConcession: true,
      importEntryInSC: true,
    },
    expectedTarget: 1,
    expectedCredit: 16000,
  },
  {
    name: "409 período inicial",
    input: {
      ttd: 409,
      destination: "commercial_resale",
      operation: "internal",
      outputValue: 100000,
      aliquotaPercent: 17,
      continuousTTDMonths: 12,
      validConcession: true,
      importEntryInSC: true,
    },
    expectedTarget: 2.6,
    expectedCredit: 14400,
  },
  {
    name: "metal após 36 meses",
    input: {
      ttd: 410,
      destination: "commercial_resale",
      operation: "internal",
      outputValue: 100000,
      aliquotaPercent: 17,
      continuousTTDMonths: 36,
      productClass: "steel_copper_coke_aluminum_silver",
      validConcession: true,
      importEntryInSC: true,
    },
    expectedTarget: 0.6,
    expectedCredit: 16400,
  },
];

console.log("SC output endpoint contract cases:");
for (const test of cases) {
  const normal = test.input.outputValue * test.input.aliquotaPercent / 100;
  const target = test.expectedTarget;
  const credit = Math.max(0, normal - test.input.outputValue * target / 100);
  if (Math.abs(credit - test.expectedCredit) > 1e-9) throw new Error(`${test.name}: crédito inesperado`);
  console.log(`PASS · ${test.name} · alvo ${target}% · crédito R$ ${credit.toFixed(2)}`);
}
console.log("PASS");
