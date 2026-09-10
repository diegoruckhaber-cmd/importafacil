#!/usr/bin/env python3
"""Inspect an official federal tariff workbook without mutating application data.

Reports sheet dimensions, the first rows, the detected business header containing
NCM/código, and a few data rows after that header. This is intentionally verbose
because publication code must be mapped to the actual official workbook version.
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    from openpyxl import load_workbook
except ImportError as exc:
    raise SystemExit("openpyxl is required: pip install openpyxl") from exc


def norm(value) -> str:
    raw = unicodedata.normalize("NFKD", "" if value is None else str(value))
    raw = "".join(ch for ch in raw if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", "", raw.lower())


def detect_header(rows):
    for index, row in enumerate(rows[:120]):
        keys = [norm(value) for value in row]
        if any(key in {"ncm", "codigo", "codigoncm", "ncmsh"} or key.startswith("ncm") for key in keys):
            return index
    return None


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/inspect-federal-tariff-workbook.py <xlsx>")

    path = Path(sys.argv[1])
    if not path.exists():
        raise SystemExit(f"Workbook not found: {path}")

    workbook = load_workbook(path, read_only=True, data_only=True)
    report = {"file": str(path), "sheets": []}

    for sheet in workbook.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        hidx = detect_header(rows)
        first_rows = [list(row) for row in rows[:4]]
        header = list(rows[hidx]) if hidx is not None else None
        data_sample = []
        if hidx is not None:
            for row in rows[hidx + 1 :]:
                if any(value not in (None, "") for value in row):
                    data_sample.append(list(row))
                    if len(data_sample) == 3:
                        break

        report["sheets"].append({
            "name": sheet.title,
            "max_columns": sheet.max_column,
            "non_empty_rows": sum(1 for row in rows if any(value not in (None, "") for value in row)),
            "header_row_number": (hidx + 1) if hidx is not None else None,
            "header": header,
            "first_rows": first_rows,
            "data_sample": data_sample,
        })

    print(json.dumps(report, ensure_ascii=False, indent=2, default=str))


if __name__ == "__main__":
    main()
