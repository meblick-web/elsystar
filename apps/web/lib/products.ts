import { isDatabaseConfigured, prisma, ProductStatus } from "@elsystar/database";

export interface PublicProduct {
  id: string;
  slug: string;
  model: string;
  name: string;
  shortDescription: string;
  description: string | null;
  specifications: Array<{ id: string; label: string; value: string; unit: string | null }>;
  documents: Array<{ id: string; title: string; fileUrl: string; version: string | null; type: string }>;
}

const fallbackProducts: PublicProduct[] = [
  {
    id: "fallback-uk-4-1m",
    slug: "uk-4-1m",
    model: "УК-4.1М",
    name: "Дорожный контроллер УК-4.1М",
    shortDescription: "Универсальный дорожный контроллер для локального и сетевого управления регулируемыми перекрёстками.",
    description: "Контроллер предназначен для управления транспортными и пешеходными потоками и может работать как автономно, так и в составе АСУДТ.",
    specifications: [
      { id: "uk41-phases", label: "Число фаз движения", value: "16", unit: null },
      { id: "uk41-directions", label: "Число направлений", value: "16", unit: null },
      { id: "uk41-channels", label: "Силовые каналы", value: "32", unit: null },
      { id: "uk41-interfaces", label: "Интерфейсы", value: "RS-232, RS-485", unit: null },
    ],
    documents: [],
  },
  {
    id: "fallback-uk-2-5",
    slug: "uk-2-5",
    model: "УК-2.5",
    name: "Дорожный контроллер УК-2.5",
    shortDescription: "Компактный контроллер для локального и сетевого управления транспортными потоками и пешеходами.",
    description: "Модель предназначена для светофорных объектов меньшей сложности и совместима с ранее применявшимися решениями семейства УК-2.",
    specifications: [
      { id: "uk25-phases", label: "Число фаз", value: "до 4", unit: null },
      { id: "uk25-directions", label: "Число направлений", value: "до 8", unit: null },
      { id: "uk25-channels", label: "Силовые каналы", value: "16", unit: null },
      { id: "uk25-size", label: "Габариты", value: "325 × 530 × 545", unit: "мм" },
    ],
    documents: [],
  },
];

function normalizeProduct(product: {
  id: string;
  slug: string;
  model: string;
  name: string;
  shortDescription: string;
  description: string | null;
  specifications: Array<{ id: string; label: string; value: string; unit: string | null }>;
  documents: Array<{ id: string; title: string; fileUrl: string; version: string | null; type: unknown }>;
}): PublicProduct {
  return {
    ...product,
    documents: product.documents.map((document) => ({ ...document, type: String(document.type) })),
  };
}

export async function getPublishedProducts() {
  if (isDatabaseConfigured() && prisma) {
    try {
      const products = await prisma.product.findMany({
        where: { status: ProductStatus.PUBLISHED },
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
        include: {
          specifications: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
          documents: { where: { publishedAt: { not: null } }, orderBy: { publishedAt: "desc" } },
        },
      });
      if (products.length) return products.map(normalizeProduct);
    } catch (error) {
      console.error("public_products_query_failed", error);
    }
  }
  return fallbackProducts;
}

export async function getFeaturedProducts() {
  if (isDatabaseConfigured() && prisma) {
    try {
      const products = await prisma.product.findMany({
        where: { status: ProductStatus.PUBLISHED, featured: true },
        take: 2,
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
        include: { specifications: true, documents: true },
      });
      if (products.length) return products.map(normalizeProduct);
    } catch (error) {
      console.error("featured_products_query_failed", error);
    }
  }
  return fallbackProducts.slice(0, 2);
}

export async function getProductBySlug(slug: string) {
  if (isDatabaseConfigured() && prisma) {
    try {
      const product = await prisma.product.findFirst({
        where: { slug, status: ProductStatus.PUBLISHED },
        include: {
          specifications: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
          documents: { where: { publishedAt: { not: null } }, orderBy: { publishedAt: "desc" } },
        },
      });
      if (product) return normalizeProduct(product);
    } catch (error) {
      console.error("public_product_query_failed", error);
    }
  }
  return fallbackProducts.find((product) => product.slug === slug) ?? null;
}
