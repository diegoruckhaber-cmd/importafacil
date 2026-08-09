import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ImportaFácil",
  description: "Pré-estudo de importação: custo, margem e viabilidade."
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
