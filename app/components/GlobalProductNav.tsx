"use client";

import { usePathname } from "next/navigation";

const HIDDEN_ROUTES = new Set(["/", "/simulacao-v2", "/privacidade", "/termos", "/regras"]);

export default function GlobalProductNav() {
  const pathname = usePathname();

  if (HIDDEN_ROUTES.has(pathname) || pathname === "/dashboard" || pathname.startsWith("/sc-")) return null;

  const authRoute = pathname === "/auth" || pathname === "/login";

  return (
    <header className="productTopbar" data-product-nav="unified">
      <div className="wrap productNav">
        <a className="logo" href="/">ImportaFácil</a>
        <nav className="productNavLinks" aria-label="Navegação do produto">
          {!authRoute && <a href="/simulacao-v2">Nova simulação</a>}
          {!authRoute && <a href="/dashboard">Meu painel</a>}
          {!authRoute && <a href="/comparar">Comparar</a>}
          <a className="navCta" href={authRoute ? "/simulacao-v2" : "/upgrade"}>
            {authRoute ? "Simular grátis" : "PRO"}
          </a>
        </nav>
      </div>
    </header>
  );
}
