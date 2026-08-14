# Implementation status

## Already present

- SC multi-item final-cost engine.
- Expense allocation by value, quantity, weight and volume.
- Item-level SC benefit decision layer.
- Federal 2026 PIS/Cofins rule layer.
- Federal II treatment layer.
- Federal special-regime foundation catalog.
- Authenticated simulation persistence.

## Current completion gate

Integrate the federal resolution layer into the user-facing SC operation, replace manual federal rates wherever a safe resolver exists, and expose conditional warnings instead of silently accepting unsupported fiscal assumptions.

## Explicit release constraint

No other state implementation before SC + federal acceptance and first user test.
