import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

type SnapshotRecord = {
  sourceType: "mdic-ii" | "rfb-ipi";
  ncm: string;
  rate: number;
  sheet: string;
};

type Snapshot = { records: SnapshotRecord[] };

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "federal", "official-snapshot-2026-07.json");

function normalizeNcm(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeNcm(searchParams.get("q") ?? "");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 12), 1), 30);

  if (query.length < 2) return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "public, max-age=3600" } });

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8")) as Snapshot;
  const seen = new Set<string>();
  const items: string[] = [];

  for (const record of snapshot.records) {
    const ncm = normalizeNcm(record.ncm);
    if (!ncm.startsWith(query) || seen.has(ncm)) continue;
    seen.add(ncm);
    items.push(ncm);
    if (items.length >= limit) break;
  }

  return NextResponse.json({ items }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
