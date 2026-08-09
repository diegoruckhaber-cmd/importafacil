import { NextResponse } from "next/server";

/*
  Checkout boundary.
  This endpoint deliberately refuses to pretend that payments are live.
  Connect the selected payment provider here after credentials and a price ID
  are configured.
*/
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.email) {
    return NextResponse.json({error:"E-mail é obrigatório."},{status:400});
  }
  return NextResponse.json({
    status:"payment_not_connected",
    message:"Checkout ainda não está conectado. Configure o provedor de pagamentos e o price ID do plano PRO.",
    requestedPlan: body.plan ?? "PRO"
  }, {status:501});
}
