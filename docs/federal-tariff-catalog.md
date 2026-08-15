# Federal tariff catalog

The federal II layer is intentionally split into **official data** and **resolution logic**.

## Official inputs

The current production data refresh should consume the MDIC tariff workbook for the TEC and Brazilian exceptions/temporary mechanisms. The MDIC page identifies the current workbook as containing Annexes I–X of Gecex Resolution 272/2021 and lists TEC, Brazilian differences, supply reductions, LETEC, LEBIT/BK, OMC concessions, DCC and ACE-14 mechanisms.

The Receita Federal TIPI workbook is the source for IPI rates and must remain a separate catalog because II and IPI have different legal bases and precedence rules.

## Resolver contract

Each normalized row must contain:

- NCM;
- percentage-point rate;
- source mechanism;
- validity start/end;
- legal basis;
- explicit precedence priority;
- quota metadata when applicable.

A missing NCM or an ambiguous active treatment returns `automatic: false` and never assumes zero tax.

## Precedence

The data importer assigns priority according to the legal hierarchy represented in the official tariff data. The resolver itself does not infer legal priority from descriptions. This prevents a future spreadsheet refresh from silently changing fiscal treatment because of a guessed rule.

## Next integration

Populate `FEDERAL_TARIFF_CATALOG` from the normalized July 2026 MDIC workbook, then connect `resolveFederalTariff()` to the existing federal tax-resolution flow. IPI should subsequently use a parallel TIPI catalog rather than being embedded in the II table.
