import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://importafacil-projetovendas.vercel.app";
  return [{
    url: base,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1
  }];
}
