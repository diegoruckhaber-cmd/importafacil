import { NextResponse } from "next/server";
import { calculate, SimulationInput } from "../../../lib/calculator";

/*
  V7 API boundary.
  For now it is stateless: POST calculates and returns a simulation.
  The next integration replaces the temporary response with a database write
  after authentication is connected.
*/
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input: SimulationInput = body.input;
    if (!input || input.quantity <= 0 || input.fx <= 0) {
      return NextResponse.json({error:"Dados de simulação inválidos."},{status:400});
    }
    return NextResponse.json({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "calculated",
      result: calculate(input),
      persistence: "pending-database"
    });
  } catch {
    return NextResponse.json({error:"Não foi possível processar a simulação."},{status:400});
  }
}

export async function GET() {
  return NextResponse.json({
    simulations: [],
    message: "Persistência será ativada quando o banco de dados estiver conectado."
  });
}
