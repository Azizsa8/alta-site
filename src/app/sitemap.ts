import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { company } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = [
    { path: "/", priority: 1 },
    { path: "/about", priority: 0.9 },
    { path: "/services", priority: 0.9 },
    { path: "/sectors", priority: 0.8 },
    { path: "/projects", priority: 0.8 },
    { path: "/media-center", priority: 0.7 },
    { path: "/careers", priority: 0.6 },
    { path: "/faq", priority: 0.6 },
    { path: "/contact", priority: 0.8 },
    { path: "/request-quote", priority: 0.8 },
    { path: "/privacy-policy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: `${company.origin}${r.path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: r.priority,
    })),
    ...services.map((s) => ({
      url: `${company.origin}/services/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
  ];
}
