import { DocumentType, isDatabaseConfigured, prisma } from "@elsystar/database";

export type PublicDocumentVersion = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  version: string | null;
  language: string;
  mimeType: string | null;
  fileSize: number | null;
  checksumSha256: string | null;
  releaseNotes: string | null;
  releaseDate: Date | null;
  isCurrent: boolean;
};

export type PublicDocumentSeries = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  language: string;
  product: { id: string; model: string; slug: string } | null;
  currentVersion: PublicDocumentVersion | null;
  versions: PublicDocumentVersion[];
};

export type SupportFilters = {
  q?: string;
  type?: string;
  productId?: string;
  language?: string;
};

function validType(value?: string) {
  return value && Object.values(DocumentType).includes(value as DocumentType) ? value as DocumentType : undefined;
}

function mapVersion(document: any): PublicDocumentVersion {
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    type: String(document.type),
    fileUrl: document.fileUrl,
    fileName: document.fileName,
    version: document.version,
    language: document.language,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    checksumSha256: document.checksumSha256,
    releaseNotes: document.releaseNotes,
    releaseDate: document.releaseDate,
    isCurrent: document.isCurrent,
  };
}

export async function getSupportLibrary(filters: SupportFilters = {}) {
  if (!isDatabaseConfigured() || !prisma) return { series: [] as PublicDocumentSeries[], legacy: [] as PublicDocumentVersion[], products: [] as Array<{ id: string; model: string }>, languages: [] as string[] };

  const q = filters.q?.trim() || "";
  const type = validType(filters.type);
  const productId = filters.productId?.trim() || "";
  const language = filters.language?.trim().toLowerCase() || "";
  const where: any = { versions: { some: { isPublic: true, publishedAt: { not: null } } } };
  if (q) where.OR = [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { product: { model: { contains: q, mode: "insensitive" } } }];
  if (type) where.type = type;
  if (productId) where.productId = productId;
  if (language) where.language = language;

  try {
    const [seriesRows, products, languageRows, legacyRows] = await Promise.all([
      prisma.documentSeries.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
        include: {
          product: { select: { id: true, model: true, slug: true } },
          versions: { where: { isPublic: true, publishedAt: { not: null } }, orderBy: [{ isCurrent: "desc" }, { releaseDate: "desc" }, { createdAt: "desc" }] },
        },
      }),
      prisma.product.findMany({ where: { documentSeries: { some: { versions: { some: { isPublic: true, publishedAt: { not: null } } } } } }, orderBy: { model: "asc" }, select: { id: true, model: true } }),
      prisma.documentSeries.findMany({ where: { versions: { some: { isPublic: true, publishedAt: { not: null } } } }, distinct: ["language"], orderBy: { language: "asc" }, select: { language: true } }),
      prisma.document.findMany({ where: { seriesId: null, isPublic: true, publishedAt: { not: null }, ...(type ? { type } : {}), ...(productId ? { productId } : {}), ...(language ? { language } : {}), ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { fileName: { contains: q, mode: "insensitive" } }] } : {}) }, orderBy: [{ type: "asc" }, { publishedAt: "desc" }] }),
    ]);

    const series = seriesRows.map((item) => {
      const versions = item.versions.map(mapVersion);
      return { id: item.id, slug: item.slug, title: item.title, description: item.description, type: String(item.type), language: item.language, product: item.product, currentVersion: versions.find((version) => version.isCurrent) ?? versions[0] ?? null, versions };
    });
    return { series, legacy: legacyRows.map(mapVersion), products, languages: languageRows.map((item) => item.language) };
  } catch (error) {
    console.error("support_library_query_failed", error);
    return { series: [] as PublicDocumentSeries[], legacy: [] as PublicDocumentVersion[], products: [] as Array<{ id: string; model: string }>, languages: [] as string[] };
  }
}

export async function getPublicDocumentSeriesBySlug(slug: string): Promise<PublicDocumentSeries | null> {
  if (!isDatabaseConfigured() || !prisma) return null;
  try {
    const series = await prisma.documentSeries.findUnique({
      where: { slug },
      include: {
        product: { select: { id: true, model: true, slug: true } },
        versions: { where: { isPublic: true, publishedAt: { not: null } }, orderBy: [{ isCurrent: "desc" }, { releaseDate: "desc" }, { createdAt: "desc" }] },
      },
    });
    if (!series || !series.versions.length) return null;
    const versions = series.versions.map(mapVersion);
    return { id: series.id, slug: series.slug, title: series.title, description: series.description, type: String(series.type), language: series.language, product: series.product, currentVersion: versions.find((version) => version.isCurrent) ?? versions[0] ?? null, versions };
  } catch (error) {
    console.error("public_document_series_query_failed", error);
    return null;
  }
}
