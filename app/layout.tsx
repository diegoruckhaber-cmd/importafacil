import type { Metadata } from "next";
import "./globals.css";

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
  return <html lang="pt-BR"><body>{children}</body></html>;
}
