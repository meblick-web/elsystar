import type { Metadata } from "next";
import { isDatabaseConfigured, prisma } from "@elsystar/database";

export async function resolveSeoMetadata(path: string, fallback: Metadata): Promise<Metadata> {
  if (!isDatabaseConfigured() || !prisma) return fallback;
  try {
    const route = await prisma.seoRoute.findUnique({ where: { path } });
    if (!route) return fallback;
    return {
      ...fallback,
      title: route.title || fallback.title,
      description: route.description || fallback.description,
      alternates: route.canonical ? { canonical: route.canonical } : fallback.alternates,
      robots: { index: route.indexable, follow: route.follow },
    };
  } catch (error) {
    console.error("seo_route_query_failed", error);
    return fallback;
  }
}
