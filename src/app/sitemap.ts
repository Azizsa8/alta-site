import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { serviceSectors } from "@/content/serviceSectors";
import { publishedArticles } from "@/content/articles";
import { platforms } from "@/content/platforms";
import { company } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = [
    { path: "/", priority: 1 },
    { path: "/about", priority: 0.9 },
    { path: "/services", priority: 0.9 },
    { path: "/sectors", priority: 0.8 },
    { path: "/industries", priority: 0.6 },
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
    ...serviceSectors.map((s) => ({
      url: `${company.origin}/sectors/${s.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    ...publishedArticles.map((a) => ({
      url: `${company.origin}/media-center/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${company.origin}/services/ai-engineering/platforms`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...platforms.map((p) => ({
      url: `${company.origin}/services/ai-engineering/platforms/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
