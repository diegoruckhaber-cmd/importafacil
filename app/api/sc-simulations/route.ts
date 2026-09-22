import { POST as saveSimulation } from "../simulations/route";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return saveSimulation(new Request(req.url, {
      method: "POST", headers: req.headers,
      body: JSON.stringify({ ...body, mode: "sc" }),
    }));
  } catch {
    return NextResponse.json({ error: "Dados da operação SC inválidos." }, { status: 400 });
  }
}
