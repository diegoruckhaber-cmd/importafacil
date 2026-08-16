#!/usr/bin/env python3
"""Transform the official MDIC tariff workbook into the ImportaFácil catalog contract.

The transformer is intentionally conservative: it discovers likely NCM/rate columns,
normalizes NCM values, preserves the source sheet and raw row, and refuses to publish
ambiguous rows instead of guessing. It does not alter application data automatically.

Usage:
  python scripts/transform-federal-tariff-workbook.py input.xlsx output.json
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

NCM_RE = re.compile(r"^\d{8}$")


def clean_text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def normalize_ncm(value: Any) -> str | None:
    text = clean_text(value).replace(".", "").replace(" ", "")
    if text.isdigit() and len(text) == 7:
        text = "0" + text
    return text if NCM_RE.fullmatch(text) else None


def header_key(value: Any) -> str:
    text = clean_text(value).lower()
    return re.sub(r"[^a-z0-9]+", "", text)


def find_column(headers: list[Any], candidates: set[str]) -> int | None:
    normalized = [header_key(value) for value in headers]
    for index, value in enumerate(normalized):
        if value in candidates:
            return index
    return None


def rate_value(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = clean_text(value).replace("%", "").replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python scripts/transform-federal-tariff-workbook.py <input.xlsx> <output.json>")

    source = Path(sys.argv[1])
    destination = Path(sys.argv[2])
    if not source.exists():
        raise SystemExit(f"Workbook not found: {source}")

    workbook = load_workbook(source, read_only=True, data_only=True)
    records: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []

    ncm_candidates = {"ncm", "codigo", "codigoncm", "codigoncmsh"}
    rate_candidates = {"aliquota", "aliquotaii", "ii", "tarifa", "tec"}

    for sheet in workbook.worksheets:
        rows = sheet.iter_rows(values_only=True)
        headers = list(next(rows, ()))
        ncm_index = find_column(headers, ncm_candidates)
        rate_index = find_column(headers, rate_candidates)

        if ncm_index is None:
            continue

        for row_number, row in enumerate(rows, start=2):
            if not any(value not in (None, "") for value in row):
                continue

            ncm = normalize_ncm(row[ncm_index] if ncm_index < len(row) else None)
            rate = rate_value(row[rate_index]) if rate_index is not None and rate_index < len(row) else None

            if ncm is None or rate is None:
                rejected.append({
                    "sheet": sheet.title,
                    "row": row_number,
                    "reason": "missing_or_ambiguous_ncm_or_rate",
                    "raw": [clean_text(value) for value in row],
                })
                continue

            records.append({
                "ncm": ncm,
                "iiRate": rate,
                "sourceSheet": sheet.title,
                "sourceRow": row_number,
                "sourceWorkbook": source.name,
                "treatment": "official-mdic-workbook",
            })

    if not records:
        raise SystemExit("No unambiguous NCM/rate records found; refusing to generate an empty catalog.")

    output = {
        "schemaVersion": 1,
        "source": source.name,
        "recordCount": len(records),
        "rejectedCount": len(rejected),
        "records": records,
        "rejected": rejected,
        "publicationStatus": "candidate",
        "note": "Candidate snapshot only. Review source-specific columns and legal precedence before production publication.",
    }

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"generated {len(records)} candidate records; rejected {len(rejected)} rows")


if __name__ == "__main__":
    main()
