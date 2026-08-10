import type { MetadataRoute } from "next";
import { ContentStatus, isDatabaseConfigured, prisma, ProductStatus } from "@elsystar/database";
import { absoluteSiteUrl } from "../lib/site";

const staticPages: Array<{ path: string; priority: number; changeFrequency: "weekly" | "monthly" }> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/products", priority: 0.9, changeFrequency: "weekly" },
  { path: "/solutions", priority: 0.9, changeFrequency: "weekly" },
  { path: "/projects", priority: 0.8, changeFrequency: "weekly" },
  { path: "/support", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/production", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contacts", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
];

const englishStaticPages: Array<{ path: string; priority: number; changeFrequency: "weekly" | "monthly" }> = [
  { path: "/en", priority: 0.9, changeFrequency: "weekly" },
  { path: "/en/products", priority: 0.8, changeFrequency: "weekly" },
  { path: "/en/solutions", priority: 0.8, changeFrequency: "weekly" },
  { path: "/en/support", priority: 0.7, changeFrequency: "weekly" },
  { path: "/en/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/en/production", priority: 0.6, changeFrequency: "monthly" },
  { path: "/en/contacts", priority: 0.6, changeFrequency: "monthly" },
  { path: "/en/faq", priority: 0.5, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  let noindexPaths = new Set<string>();

  if (isDatabaseConfigured() && prisma) {
    try {
      const disabled = await prisma.seoRoute.findMany({ where: { indexable: false }, select: { path: true } });
      noindexPaths = new Set(disabled.map((item) => item.path));
    } catch (error) {
      console.error("sitemap_noindex_query_failed", error);
    }
  }

  const entries: MetadataRoute.Sitemap = [...staticPages, ...englishStaticPages]
    .filter((item) => !noindexPaths.has(item.path))
    .map((item) => ({ url: absoluteSiteUrl(item.path), lastModified: now, changeFrequency: item.changeFrequency, priority: item.priority }));

  if (!isDatabaseConfigured() || !prisma) return entries;

  try {
    const [products, solutions, projects, documentSeries, translations] = await Promise.all([
      prisma.product.findMany({ where: { status: ProductStatus.PUBLISHED }, select: { slug: true, updatedAt: true } }),
      prisma.solution.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { slug: true, updatedAt: true } }),
      prisma.project.findMany({ where: { status: ContentStatus.PUBLISHED, isDemo: false }, select: { slug: true, updatedAt: true } }),
      prisma.documentSeries.findMany({ where: { versions: { some: { isCurrent: true, isPublic: true, publishedAt: { not: null } } } }, select: { slug: true, updatedAt: true } }),
      prisma.contentTranslation.findMany({ where: { locale: "en", OR: [
        { entityType: "Product", field: "name" },
        { entityType: "Solution", field: "name" },
        { entityType: "Project", field: "title" },
        { entityType: "DocumentSeries", field: "title" },
      ] }, select: { entityType: true, entityId: true } }),
    ]);

    const translated = new Map<string, Set<string>>();
    for (const item of translations) {
      if (!translated.has(item.entityType)) translated.set(item.entityType, new Set());
      translated.get(item.entityType)!.add(item.entityId);
    }

    if (projects.length === 0) {
      for (const path of ["/projects", "/en/projects"]) {
        const index = entries.findIndex((entry) => entry.url === absoluteSiteUrl(path));
        if (index >= 0) entries.splice(index, 1);
      }
    } else if (!noindexPaths.has("/en/projects")) {
      entries.push({ url: absoluteSiteUrl("/en/projects"), lastModified: now, changeFrequency: "weekly", priority: 0.7 });
    }

    for (const product of products) {
      const ru = `/products/${product.slug}`;
      if (!noindexPaths.has(ru)) entries.push({ url: absoluteSiteUrl(ru), lastModified: product.updatedAt, changeFrequency: "monthly", priority: 0.8 });
      const en = `/en/products/${product.slug}`;
      if (translated.get("Product")?.has(product.slug) && !noindexPaths.has(en)) entries.push({ url: absoluteSiteUrl(en), lastModified: product.updatedAt, changeFrequency: "monthly", priority: 0.7 });
    }
    for (const solution of solutions) {
      const ru = `/solutions/${solution.slug}`;
      if (!noindexPaths.has(ru)) entries.push({ url: absoluteSiteUrl(ru), lastModified: solution.updatedAt, changeFrequency: "monthly", priority: 0.8 });
      const en = `/en/solutions/${solution.slug}`;
      if (translated.get("Solution")?.has(solution.slug) && !noindexPaths.has(en)) entries.push({ url: absoluteSiteUrl(en), lastModified: solution.updatedAt, changeFrequency: "monthly", priority: 0.7 });
    }
    for (const project of projects) {
      const ru = `/projects/${project.slug}`;
      if (!noindexPaths.has(ru)) entries.push({ url: absoluteSiteUrl(ru), lastModified: project.updatedAt, changeFrequency: "monthly", priority: 0.7 });
      const en = `/en/projects/${project.slug}`;
      if (translated.get("Project")?.has(project.slug) && !noindexPaths.has(en)) entries.push({ url: absoluteSiteUrl(en), lastModified: project.updatedAt, changeFrequency: "monthly", priority: 0.6 });
    }
    for (const series of documentSeries) {
      const ru = `/support/${series.slug}`;
      if (!noindexPaths.has(ru)) entries.push({ url: absoluteSiteUrl(ru), lastModified: series.updatedAt, changeFrequency: "monthly", priority: 0.6 });
      const en = `/en/support/${series.slug}`;
      if (translated.get("DocumentSeries")?.has(series.slug) && !noindexPaths.has(en)) entries.push({ url: absoluteSiteUrl(en), lastModified: series.updatedAt, changeFrequency: "monthly", priority: 0.5 });
    }
  } catch (error) {
    console.error("sitemap_content_query_failed", error);
  }

  return entries;
}
