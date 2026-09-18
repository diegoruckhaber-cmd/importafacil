import type { Metadata } from "next";
import "./globals.css";
import TemporaryIIAlertEnhancer from "./TemporaryIIAlertEnhancer";
import { getReleaseScope } from "../lib/release-scope";

const PUBLIC_SITE_URL = "https://importafacil-gamma.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: {
    default: "ImportaFácil | Simulador de Importação",
    template: "%s | ImportaFácil",
  },
  description: "Simule o custo nacionalizado da sua importação, preço mínimo e lucro estimado antes de comprar.",
  keywords: ["simulador de importação", "custo de importação", "importação", "custo nacionalizado", "NCM", "comércio exterior"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "ImportaFácil | Simulador de Importação",
    description: "Descubra se a conta da sua importação fecha antes de comprometer seu capital.",
    type: "website",
    locale: "pt_BR",
    url: PUBLIC_SITE_URL,
    siteName: "ImportaFácil",
  },
  twitter: {
    card: "summary",
    title: "ImportaFácil | Simulador de Importação",
    description: "Descubra se a conta da sua importação fecha antes de comprometer seu capital.",
  },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  const release = getReleaseScope();
  return (
    <html lang="pt-BR">
      <body>
        <a className="skipLink" href="#conteudo-principal">Pular para o conteúdo principal</a>
        <TemporaryIIAlertEnhancer />
        <aside
          aria-label="Status de disponibilidade do produto"
          data-release-scope="controlled-beta"
          style={{padding:"10px 18px",borderBottom:"1px solid #d8d8d8",fontSize:13,lineHeight:1.45}}
        >
          <strong>{release.controlledBeta.label}</strong> · {release.controlledBeta.notice}
        </aside>
        <div id="conteudo-principal">{children}</div>
      </body>
    </html>
  );
}
