import type { MetadataRoute } from "next";

const PUBLIC_SITE_URL = "https://importafacil-gamma.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/privacidade", "/termos"];
  return paths.map((path, index) => ({
    url: PUBLIC_SITE_URL + path,
    lastModified: new Date(),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.4,
  }));
}
