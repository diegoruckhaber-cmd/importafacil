import { NextResponse } from "next/server";

/*
  Subscription boundary for the authenticated application.
  Real status must come from the payment provider webhook/database.
*/
export async function GET() {
  return NextResponse.json({
    plan:"FREE",
    status:"not_connected",
    message:"Autenticação, banco e webhooks ainda precisam ser conectados."
  });
}
