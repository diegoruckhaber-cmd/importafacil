import type { MetadataRoute } from "next";

const PUBLIC_SITE_URL = "https://importafacil-gamma.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/simulacao-v2", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/regras", changeFrequency: "weekly" as const, priority: 0.7 },
    { path: "/privacidade", changeFrequency: "monthly" as const, priority: 0.4 },
    { path: "/termos", changeFrequency: "monthly" as const, priority: 0.4 },
  ];
  return routes.map((route) => ({
    url: PUBLIC_SITE_URL + route.path,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
