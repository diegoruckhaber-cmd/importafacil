import { calculateImportCost } from "../lib/import-cost-engine.ts";

const result = calculateImportCost([
  { id: "frete-internacional", description: "Frete internacional", amount: 5000, treatment: "customs_base" },
  { id: "despesa-alfandegaria", description: "Despesa devida à repartição alfandegária", amount: 800, treatment: "icms_import_base" },
  { id: "porto", description: "Despesa portuária local", amount: 2500, treatment: "operational_cost" },
  { id: "despachante", description: "Honorários de despachante", amount: 1500, treatment: "conditional" },
]);

if (result.customsBaseExpenses !== 5000) throw new Error("Frete não classificado corretamente");
if (result.icmsImportBaseExpenses !== 800) throw new Error("Despesa alfandegária não classificada corretamente");
if (result.operationalExpenses !== 2500) throw new Error("Despesa portuária não classificada corretamente");
if (result.conditionalExpenses !== 1500) throw new Error("Despachante não classificado como condicional");
if (result.totalOperationalCost !== 4000) throw new Error("Custo operacional incorreto");
if (result.warnings.length !== 1) throw new Error("Alerta condicional não gerado");

console.log("Import cost engine: PASS");
