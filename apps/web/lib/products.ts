import { isDatabaseConfigured, prisma, ProductStatus } from "@elsystar/database";

export interface PublicProduct {
  id: string;
  slug: string;
  model: string;
  name: string;
  shortDescription: string;
  description: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  category: { id: string; slug: string; name: string; parent: { name: string } | null } | null;
  specifications: Array<{ id: string; label: string; value: string; unit: string | null }>;
  features: Array<{ id: string; title: string; description: string | null }>;
  configurations: Array<{ id: string; name: string; description: string | null; sku: string | null }>;
  mediaAssets: Array<{ id: string; title: string; alt: string | null; url: string; isPrimary: boolean }>;
  documents: Array<{ id: string; title: string; fileUrl: string; version: string | null; type: string }>;
  solutions: Array<{ id: string; slug: string; name: string; shortDescription: string }>;
  projects: Array<{ id: string; slug: string; title: string; city: string | null; year: number | null }>;
  relatedProducts: Array<{ id: string; type: string; product: { id: string; slug: string; model: string; name: string; shortDescription: string; imageUrl: string | null } }>;
}

export interface PublicProductCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parent: { id: string; slug: string; name: string } | null;
}

const fallbackProducts: PublicProduct[] = [
  {
    id: "fallback-uk-4-1m", slug: "uk-4-1m", model: "УК-4.1М", name: "Дорожный контроллер УК-4.1М",
    shortDescription: "Универсальный дорожный контроллер для локального и сетевого управления регулируемыми перекрёстками.",
    description: "Контроллер предназначен для управления транспортными и пешеходными потоками и может работать как автономно, так и в составе АСУДТ.",
    category: { id: "fallback-controllers", slug: "road-controllers", name: "Дорожные контроллеры", parent: null },
    specifications: [
      { id: "uk41-phases", label: "Число фаз движения", value: "16", unit: null },
      { id: "uk41-directions", label: "Число направлений", value: "16", unit: null },
      { id: "uk41-programs", label: "Фиксированные программы", value: "16", unit: null },
      { id: "uk41-channels", label: "Силовые каналы", value: "32", unit: null },
      { id: "uk41-current", label: "Максимальный ток канала", value: "5", unit: "А" },
      { id: "uk41-interfaces", label: "Интерфейсы", value: "RS-232, RS-485", unit: null },
    ],
    features: [
      { id: "uk41-feature-network", title: "Локальная и сетевая работа", description: "Работа автономно или в составе централизованной системы управления." },
      { id: "uk41-feature-diagnostics", title: "Диагностика", description: "Контроль состояния, конфликтов и ведение электронного журнала." },
      { id: "uk41-feature-comms", title: "Гибкая связь", description: "Поддержка проводных, радиоканальных и GPRS-сценариев связи." },
    ],
    configurations: [], mediaAssets: [], documents: [], solutions: [], projects: [], relatedProducts: [],
  },
  {
    id: "fallback-uk-2-5", slug: "uk-2-5", model: "УК-2.5", name: "Дорожный контроллер УК-2.5",
    shortDescription: "Компактный контроллер для локального и сетевого управления транспортными потоками и пешеходами.",
    description: "Модель предназначена для светофорных объектов меньшей сложности и совместима с ранее применявшимися решениями семейства УК-2.",
    category: { id: "fallback-controllers", slug: "road-controllers", name: "Дорожные контроллеры", parent: null },
    specifications: [
      { id: "uk25-phases", label: "Число фаз", value: "до 4", unit: null },
      { id: "uk25-directions", label: "Число направлений", value: "до 8", unit: null },
      { id: "uk25-channels", label: "Силовые каналы", value: "16", unit: null },
    ],
    features: [
      { id: "uk25-feature-compact", title: "Для объектов меньшей сложности", description: "Рациональная конфигурация для перекрёстков с меньшим числом направлений и фаз." },
      { id: "uk25-feature-network", title: "Сетевая интеграция", description: "Поддерживает использование в составе общей системы управления." },
    ],
    configurations: [], mediaAssets: [], documents: [], solutions: [], projects: [], relatedProducts: [],
  },
];

const publicDocuments = { where: { isPublic: true, publishedAt: { not: null as Date | null }, OR: [{ seriesId: null }, { isCurrent: true }] }, orderBy: { publishedAt: "desc" as const } };

const productInclude = {
  category: { include: { parent: { select: { name: true } } } },
  specifications: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
  features: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
  configurations: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
  mediaAssets: { where: { type: "IMAGE" as const }, orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
  documents: publicDocuments,
  solutions: { where: { status: "PUBLISHED" as const }, select: { id: true, slug: true, name: true, shortDescription: true }, orderBy: { sortOrder: "asc" as const } },
  projects: { where: { status: "PUBLISHED" as const }, select: { id: true, slug: true, title: true, city: true, year: true }, orderBy: [{ year: "desc" as const }, { sortOrder: "asc" as const }] },
  outgoingRelations: { orderBy: [{ type: "asc" as const }, { sortOrder: "asc" as const }], include: { targetProduct: { include: { mediaAssets: { where: { type: "IMAGE" as const }, orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }], take: 1 } } } } },
};

function normalizeProduct(product: any): PublicProduct {
  return {
    id: product.id, slug: product.slug, model: product.model, name: product.name, shortDescription: product.shortDescription, description: product.description,
    seoTitle: product.seoTitle ?? null, seoDescription: product.seoDescription ?? null,
    category: product.category ? { id: product.category.id, slug: product.category.slug, name: product.category.name, parent: product.category.parent ? { name: product.category.parent.name } : null } : null,
    specifications: product.specifications.map((item: any) => ({ id: item.id, label: item.label, value: item.value, unit: item.unit })),
    features: product.features.map((item: any) => ({ id: item.id, title: item.title, description: item.description })),
    configurations: product.configurations.map((item: any) => ({ id: item.id, name: item.name, description: item.description, sku: item.sku })),
    mediaAssets: product.mediaAssets.map((item: any) => ({ id: item.id, title: item.title, alt: item.alt, url: item.url, isPrimary: item.isPrimary })),
    documents: product.documents.map((item: any) => ({ id: item.id, title: item.title, fileUrl: item.fileUrl, version: item.version, type: String(item.type) })),
    solutions: product.solutions,
    projects: product.projects,
    relatedProducts: product.outgoingRelations.filter((relation: any) => relation.targetProduct.status === ProductStatus.PUBLISHED).map((relation: any) => ({ id: relation.id, type: String(relation.type), product: { id: relation.targetProduct.id, slug: relation.targetProduct.slug, model: relation.targetProduct.model, name: relation.targetProduct.name, shortDescription: relation.targetProduct.shortDescription, imageUrl: relation.targetProduct.mediaAssets[0]?.url ?? null } })),
  };
}

export async function getPublishedCategories(): Promise<PublicProductCategory[]> {
  if (isDatabaseConfigured() && prisma) {
    try {
      const categories = await prisma.productCategory.findMany({ where: { products: { some: { status: ProductStatus.PUBLISHED } } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { parent: { select: { id: true, slug: true, name: true } } } });
      return categories.map((category) => ({ id: category.id, slug: category.slug, name: category.name, description: category.description, parent: category.parent }));
    } catch (error) { console.error("public_categories_query_failed", error); }
  }
  return [{ id: "fallback-controllers", slug: "road-controllers", name: "Дорожные контроллеры", description: "Контроллеры для управления светофорными объектами.", parent: null }];
}

export async function getPublishedProducts(categorySlug?: string) {
  if (isDatabaseConfigured() && prisma) {
    try {
      const products = await prisma.product.findMany({ where: { status: ProductStatus.PUBLISHED, ...(categorySlug ? { category: { slug: categorySlug } } : {}) }, orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }], include: productInclude });
      return products.map(normalizeProduct);
    } catch (error) { console.error("public_products_query_failed", error); }
  }
  return categorySlug && categorySlug !== "road-controllers" ? [] : fallbackProducts;
}

export async function getFeaturedProducts() {
  if (isDatabaseConfigured() && prisma) {
    try {
      const products = await prisma.product.findMany({ where: { status: ProductStatus.PUBLISHED, featured: true }, take: 3, orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }], include: productInclude });
      return products.map(normalizeProduct);
    } catch (error) { console.error("featured_products_query_failed", error); }
  }
  return fallbackProducts.slice(0, 2);
}

export async function getProductBySlug(slug: string) {
  if (isDatabaseConfigured() && prisma) {
    try {
      const product = await prisma.product.findFirst({ where: { slug, status: ProductStatus.PUBLISHED }, include: productInclude });
      return product ? normalizeProduct(product) : null;
    } catch (error) { console.error("public_product_query_failed", error); }
  }
  return fallbackProducts.find((product) => product.slug === slug) ?? null;
}
