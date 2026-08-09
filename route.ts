import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "importafacil",
    version: "v7",
    database: "not-connected",
    payments: "not-connected",
    auth: "not-connected"
  });
}
