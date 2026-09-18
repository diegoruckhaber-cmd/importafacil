import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ImportaFácil",
    short_name: "ImportaFácil",
    description: "Pré-estudo de custo nacionalizado de importações com escopo fiscal explícito.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f4",
    theme_color: "#111111",
    lang: "pt-BR",
  };
}
