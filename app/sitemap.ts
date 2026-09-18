import type { MetadataRoute } from "next";

const PUBLIC_SITE_URL = "https://importafacil-gamma.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{
    url: PUBLIC_SITE_URL,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1
  }];
}
