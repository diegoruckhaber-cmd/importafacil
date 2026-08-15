# Federal tariff catalog refresh

1. Download the current official MDIC tariff workbook.
2. Normalize NCM, rate, mechanism, dates, legal basis and quota fields.
3. Assign explicit precedence from the legal mechanism, never from description text.
4. Load the normalized rows into `FEDERAL_TARIFF_CATALOG`.
5. Run the deterministic acceptance test before connecting the catalog to production calculation.
6. Keep TIPI/ IPI in a separate versioned catalog from II.

The resolver is intentionally fail-closed: missing or ambiguous tariff data does not become a zero rate.
