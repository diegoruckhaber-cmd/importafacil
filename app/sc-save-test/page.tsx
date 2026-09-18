import { redirect } from "next/navigation";

export default function LegacySurfaceRedirect() {
  redirect("/simulacao-v2");
}
