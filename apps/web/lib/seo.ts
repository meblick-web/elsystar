import type { Metadata } from "next";
import { isDatabaseConfigured, prisma } from "@elsystar/database";
import { absoluteSiteUrl, searchIndexingEnabled, SITE_NAME } from "./site";

type EntityMetadataInput = {
  path: string;
  title: string;
  description: string;
  image?: string | null;
  index?: boolean;
  type?: "website" | "article";
};

function englishPath(path: string) {
  return path === "/" ? "/en" : `/en${path.startsWith("/") ? path : `/${path}`}`;
}

function localeAlternates(path: string, canonical: string) {
  return {
    canonical,
    languages: {
      "ru-RU": absoluteSiteUrl(path),
      en: absoluteSiteUrl(englishPath(path)),
      "x-default": absoluteSiteUrl(path),
    },
  };
}

function socialMetadata({ path, title, description, image, index = true, type = "website" }: EntityMetadataInput): Metadata {
  const canonical = absoluteSiteUrl(path);
  const canIndex = searchIndexingEnabled() && index;
  const images = image ? [{ url: image, alt: title }] : undefined;

  return {
    title,
    description,
    alternates: localeAlternates(path, canonical),
    robots: { index: canIndex, follow: canIndex },
    openGraph: {
      type,
      locale: "ru_RU",
      alternateLocale: ["en_US"],
      siteName: SITE_NAME,
      url: canonical,
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function buildEntityMetadata(input: EntityMetadataInput): Metadata {
  return socialMetadata(input);
}

export async function resolveSeoMetadata(path: string, fallback: Metadata): Promise<Metadata> {
  const fallbackTitle = typeof fallback.title === "string" ? fallback.title : SITE_NAME;
  const fallbackDescription = typeof fallback.description === "string" ? fallback.description : "";
  let route: Awaited<ReturnType<NonNullable<typeof prisma>["seoRoute"]["findUnique"]>> | null = null;

  if (isDatabaseConfigured() && prisma) {
    try {
      route = await prisma.seoRoute.findUnique({ where: { path } });
    } catch (error) {
      console.error("seo_route_query_failed", error);
    }
  }

  const title = route?.title || fallbackTitle;
  const description = route?.description || fallbackDescription;
  const canonical = route?.canonical || absoluteSiteUrl(path);
  const canIndex = searchIndexingEnabled() && (route?.indexable ?? true);
  const canFollow = searchIndexingEnabled() && (route?.follow ?? true);

  return {
    ...fallback,
    title,
    description,
    alternates: { ...fallback.alternates, ...localeAlternates(path, canonical) },
    robots: { index: canIndex, follow: canFollow },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      alternateLocale: ["en_US"],
      siteName: SITE_NAME,
      url: canonical,
      title,
      description,
      ...fallback.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...fallback.twitter,
    },
  };
}
