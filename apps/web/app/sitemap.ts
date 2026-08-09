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

  const entries: MetadataRoute.Sitemap = staticPages
    .filter((item) => !noindexPaths.has(item.path))
    .map((item) => ({
      url: absoluteSiteUrl(item.path),
      lastModified: now,
      changeFrequency: item.changeFrequency,
      priority: item.priority,
    }));

  if (!isDatabaseConfigured() || !prisma) return entries;

  try {
    const [products, solutions, projects, documentSeries] = await Promise.all([
      prisma.product.findMany({
        where: { status: ProductStatus.PUBLISHED },
        select: { slug: true, updatedAt: true },
      }),
      prisma.solution.findMany({
        where: { status: ContentStatus.PUBLISHED },
        select: { slug: true, updatedAt: true },
      }),
      prisma.project.findMany({
        where: { status: ContentStatus.PUBLISHED, isDemo: false },
        select: { slug: true, updatedAt: true },
      }),
      prisma.documentSeries.findMany({
        where: {
          versions: { some: { isCurrent: true, isPublic: true, publishedAt: { not: null } } },
        },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    for (const product of products) {
      const path = `/products/${product.slug}`;
      if (!noindexPaths.has(path)) entries.push({ url: absoluteSiteUrl(path), lastModified: product.updatedAt, changeFrequency: "monthly", priority: 0.8 });
    }
    for (const solution of solutions) {
      const path = `/solutions/${solution.slug}`;
      if (!noindexPaths.has(path)) entries.push({ url: absoluteSiteUrl(path), lastModified: solution.updatedAt, changeFrequency: "monthly", priority: 0.8 });
    }
    for (const project of projects) {
      const path = `/projects/${project.slug}`;
      if (!noindexPaths.has(path)) entries.push({ url: absoluteSiteUrl(path), lastModified: project.updatedAt, changeFrequency: "monthly", priority: 0.7 });
    }
    for (const series of documentSeries) {
      const path = `/support/${series.slug}`;
      if (!noindexPaths.has(path)) entries.push({ url: absoluteSiteUrl(path), lastModified: series.updatedAt, changeFrequency: "monthly", priority: 0.6 });
    }
  } catch (error) {
    console.error("sitemap_content_query_failed", error);
  }

  return entries;
}
