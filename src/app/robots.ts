import type { MetadataRoute } from "next";
import { company } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Operational surfaces must never be indexed.
        disallow: ["/api/", "/admin"],
      },
    ],
    sitemap: `${company.origin}/sitemap.xml`,
  };
}
