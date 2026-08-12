/**
 * ImportaFácil — Master validation suite (2026)
 *
 * This file is intentionally framework-agnostic. It defines deterministic
 * golden cases and invariants that the production engine must satisfy before
 * a tax rule can be promoted from draft to validated.
 *
 * IMPORTANT: numeric rates in the purely mathematical cases are test inputs,
 * not claims about the legally applicable rate for a real import operation.
 */

export type ValidationStatus = "pending" | "pass" | "fail" | "blocked";

export type GoldenCase = {
  id: string;
  name: string;
  category: "math" | "federal" | "state" | "benefit" | "multi-item" | "cost";
  purpose: string;
  status: ValidationStatus;
  prerequisites: string[];
  invariants: string[];
};

export const MASTER_VALIDATION_CASES: GoldenCase[] = [
  {
    id: "MATH-001",
    name: "Golden arithmetic",
    category: "math",
    purpose: "Prove that base, rate, percentage, multiplication, division and rounding operations are deterministic.",
    status: "pending",
    prerequisites: ["No legal-rate lookup is required."],
    invariants: [
      "Expected tax = taxable base × effective rate.",
      "No hidden floating-point drift beyond the configured monetary precision.",
      "Displayed rate and calculation rate may differ when the source system requires it; calculation rate wins.",
    ],
  },
  {
    id: "VA-001",
    name: "Customs value and Incoterm integrity",
    category: "math",
    purpose: "Prevent double counting of freight and insurance and preserve the commercial term semantics.",
    status: "pending",
    prerequisites: ["Incoterm supplied.", "FOB-equivalent components identified."],
    invariants: [
      "A freight amount already included in the negotiated value cannot be added again.",
      "A separately charged insurance amount cannot be lost.",
      "The resulting customs value must be explainable item by item.",
    ],
  },
  {
    id: "RATE-001",
    name: "Multi-item freight and insurance closure",
    category: "multi-item",
    purpose: "Validate item-level allocation and exact reconciliation to operation totals.",
    status: "pending",
    prerequisites: ["At least two items.", "Positive total net weight for freight allocation.", "Positive total FOB for insurance allocation."],
    invariants: [
      "Sum of allocated freight equals operation freight within the configured cent tolerance.",
      "Sum of allocated insurance equals operation insurance within the configured cent tolerance.",
      "Every item retains its own NCM and tax context.",
      "Zero denominators produce an explicit validation error, never an arbitrary allocation.",
    ],
  },
  {
    id: "FED-001",
    name: "Federal tax stack",
    category: "federal",
    purpose: "Validate II, IPI, PIS/COFINS and their dependencies without hard-coding a universal rate.",
    status: "pending",
    prerequisites: ["Versioned tax rule selected by operation date and context."],
    invariants: [
      "Missing legal rule never becomes a zero rate.",
      "PIS/COFINS rate selection can depend on importer/product context.",
      "Specific-rate taxation is supported independently from ad-valorem taxation.",
      "Effective calculation precision is preserved even when a source UI displays fewer decimals.",
    ],
  },
  {
    id: "ICMS-001",
    name: "State ICMS calculation",
    category: "state",
    purpose: "Validate ICMS as a state-specific rule graph rather than a single national formula.",
    status: "pending",
    prerequisites: ["UF, date, destination establishment and operation type supplied."],
    invariants: [
      "The ICMS base is built from the applicable state rule.",
      "Inside-the-base calculation is explicit and auditable.",
      "Federal taxes included in the state base are determined by rule, not by a universal list.",
      "Benefit and credit effects are separated from gross ICMS liability.",
    ],
  },
  {
    id: "SC-TTD409-001",
    name: "SC TTD 409 lifecycle",
    category: "benefit",
    purpose: "Model eligibility, import treatment, destination, subsequent sale and economic effect separately.",
    status: "pending",
    prerequisites: ["SC establishment context.", "Regime conditions and effective date.", "Destination of merchandise."],
    invariants: [
      "Deferral is never presented as tax elimination.",
      "Presumed credit is never represented as a simple import-base reduction.",
      "Commercial resale and industrialization paths can produce different outcomes.",
      "A change in relevant NCM/position can invalidate a benefit condition.",
      "Potential savings remain outside the guaranteed result until eligibility is validated.",
    ],
  },
  {
    id: "MULTI-002",
    name: "Three-item adversarial import",
    category: "multi-item",
    purpose: "Combine distinct NCMs, different rates, allocations, alerts and one unresolved rule.",
    status: "pending",
    prerequisites: ["Three items.", "At least one unresolved tax rule.", "Freight and insurance supplied."],
    invariants: [
      "One unresolved item cannot silently disappear in the consolidated result.",
      "Operation totals equal the sum of item totals plus operation-level costs.",
      "Alerts survive consolidation.",
      "An unresolved tax rule blocks a validated result but can still produce a clearly labelled estimate when policy allows.",
    ],
  },
  {
    id: "COST-001",
    name: "Operational cost ledger",
    category: "cost",
    purpose: "Keep fiscal bases separate from total economic cost while allowing both to reconcile.",
    status: "pending",
    prerequisites: ["Operational expense entries with source and allocation method."],
    invariants: [
      "Port, terminal, agent, customs broker, inland freight and other expenses are independently traceable.",
      "An operational expense does not enter a tax base merely because it is part of total cost.",
      "Estimated and confirmed expenses are visibly distinguished.",
      "Allocated operational costs reconcile back to their source amount.",
    ],
  },
];

export const VALIDATION_GATES = {
  mathematical: ["MATH-001", "VA-001", "RATE-001"],
  federal: ["FED-001"],
  state: ["ICMS-001", "SC-TTD409-001"],
  integration: ["MULTI-002", "COST-001"],
} as const;

export function canPromoteToValidated(statuses: Record<string, ValidationStatus>): boolean {
  return Object.values(statuses).length > 0 && Object.values(statuses).every((status) => status === "pass");
}
