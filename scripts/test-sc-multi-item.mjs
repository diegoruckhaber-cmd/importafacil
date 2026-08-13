import { evaluateSCMultiItem } from "../lib/sc-multi-item-engine.ts";

const result = evaluateSCMultiItem([
  {
    id: "ITEM-A",
    ttd: 410,
    destination: "commercial_resale",
    importEntryInSC: true,
    validConcession: true,
    sameNcmPositionAfterFractionation: true,
  },
  {
    id: "ITEM-B",
    ttd: 410,
    destination: "industrialization",
    importEntryInSC: true,
    validConcession: true,
  },
  {
    id: "ITEM-C",
    ttd: 410,
    destination: "commercial_resale",
    importEntryInSC: true,
    validConcession: false,
  },
]);

if (result.overallStatus !== "blocked") throw new Error("A operação deveria estar bloqueada por ITEM-C");
if (result.blockingItems.length !== 1 || result.blockingItems[0] !== "ITEM-C") throw new Error("Item bloqueante incorreto");
if (!result.conditionalItems.includes("ITEM-B")) throw new Error("ITEM-B deveria ser condicional");
if (result.items.find(x => x.itemId === "ITEM-A")?.decision !== "apply") throw new Error("ITEM-A deveria aplicar");

console.log("SC multi-item: PASS");
