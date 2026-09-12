import type { Metadata } from "next";
import "./globals.css";
import TemporaryIIAlertEnhancer from "./TemporaryIIAlertEnhancer";
import { getReleaseScope } from "../lib/release-scope";

export const metadata: Metadata = {
  title: "ImportaFácil | Simulador de Importação",
  description: "Simule o custo nacionalizado da sua importação, preço mínimo e lucro estimado antes de comprar.",
  keywords: ["simulador de importação", "custo de importação", "importação", "custo nacionalizado", "NCM", "comércio exterior"],
  openGraph: {
    title: "ImportaFácil | Simulador de Importação",
    description: "Descubra se a conta da sua importação fecha antes de comprometer seu capital.",
    type: "website",
    locale: "pt_BR"
  }
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  const release = getReleaseScope();
  return <html lang="pt-BR"><body><TemporaryIIAlertEnhancer />
    <aside data-release-scope="controlled-beta" style={{padding:"10px 18px",borderBottom:"1px solid #d8d8d8",fontSize:13,lineHeight:1.45}}>
      <strong>{release.controlledBeta.label}</strong> · {release.controlledBeta.notice}
    </aside>
    {children}
  </body></html>;
}
