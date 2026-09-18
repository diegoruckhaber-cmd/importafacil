import type { MetadataRoute } from "next";

const PUBLIC_SITE_URL = "https://importafacil-gamma.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth",
        "/login",
        "/dashboard",
        "/upgrade",
        "/simulacao/",
        "/sc-test",
        "/sc-federal-test",
        "/sc-save-test",
        "/sc-audit",
        "/sc-federal-live"
      ]
    },
    sitemap: PUBLIC_SITE_URL + "/sitemap.xml"
  };
}
