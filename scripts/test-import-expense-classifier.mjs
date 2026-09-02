import { classifyImportExpenses, summarizeImportExpenses } from "../lib/import-expense-classifier.ts";

const expenses = classifyImportExpenses([
  { id: "freight", description: "Frete internacional", amount: 5000, category: "freight_agent", taxBaseTreatment: "customs_value", allocation: "by_value", note: "Parâmetro de teste" },
  { id: "port", description: "Despesa portuária local", amount: 2500, category: "port", taxBaseTreatment: "cost_only", allocation: "by_weight", note: "Não presumir inclusão na base" },
  { id: "broker", description: "Despachante aduaneiro", amount: 1500, category: "customs_broker", taxBaseTreatment: "conditional", allocation: "by_value", note: "Exige classificação jurídica" },
]);

const summary = summarizeImportExpenses(expenses);
if (summary.total !== 9000) throw new Error(`Total incorreto: ${summary.total}`);
if (summary.customsValue !== 5000) throw new Error(`Valor aduaneiro incorreto: ${summary.customsValue}`);
if (summary.icmsImportBase !== 5000) throw new Error(`Base ICMS incorreta: ${summary.icmsImportBase}`);
if (summary.costOnly !== 2500) throw new Error(`Custo-only incorreto: ${summary.costOnly}`);
if (summary.conditional !== 1500) throw new Error(`Condicional incorreto: ${summary.conditional}`);
if (expenses[2].includedInImportICMSBase) throw new Error("Despesa condicional entrou indevidamente na base");

console.log("Import expense classifier: PASS");
