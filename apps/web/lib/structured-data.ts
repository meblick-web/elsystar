import { absoluteSiteUrl } from "./site";

export function organizationJsonLd(input?: { name?: string | null; email?: string | null; phone?: string | null }) {
  const name = input?.name || "ООО «Элсистар»";
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${absoluteSiteUrl("/")}#organization`,
    name,
    alternateName: "ELSYSTAR",
    url: absoluteSiteUrl("/"),
    email: input?.email || undefined,
    telephone: input?.phone || undefined,
    contactPoint: input?.phone || input?.email ? [{
      "@type": "ContactPoint",
      contactType: "sales and technical support",
      telephone: input?.phone || undefined,
      email: input?.email || undefined,
      availableLanguage: ["ru"],
    }] : undefined,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteSiteUrl("/")}#website`,
    url: absoluteSiteUrl("/"),
    name: "ELSYSTAR",
    inLanguage: "ru-RU",
    publisher: { "@id": `${absoluteSiteUrl("/")}#organization` },
  };
}

export function productJsonLd(product: {
  name: string;
  model: string;
  shortDescription: string;
  slug: string;
  image?: string | null;
  specifications?: Array<{ label: string; value: string; unit?: string | null }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    model: product.model,
    description: product.shortDescription,
    url: absoluteSiteUrl(`/products/${product.slug}`),
    image: product.image || undefined,
    brand: { "@type": "Brand", name: "ELSYSTAR" },
    manufacturer: { "@id": `${absoluteSiteUrl("/")}#organization` },
    additionalProperty: product.specifications?.slice(0, 20).map((item) => ({
      "@type": "PropertyValue",
      name: item.label,
      value: `${item.value}${item.unit ? ` ${item.unit}` : ""}`,
    })),
  };
}

export function solutionJsonLd(solution: { name: string; shortDescription: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: solution.name,
    description: solution.shortDescription,
    url: absoluteSiteUrl(`/solutions/${solution.slug}`),
    provider: { "@id": `${absoluteSiteUrl("/")}#organization` },
    areaServed: { "@type": "Country", name: "Россия" },
  };
}

export function projectJsonLd(project: { title: string; summary: string; slug: string; coverImageUrl?: string | null; year?: number | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: project.title,
    description: project.summary,
    url: absoluteSiteUrl(`/projects/${project.slug}`),
    image: project.coverImageUrl || undefined,
    datePublished: project.year ? `${project.year}-01-01` : undefined,
    author: { "@id": `${absoluteSiteUrl("/")}#organization` },
    publisher: { "@id": `${absoluteSiteUrl("/")}#organization` },
  };
}
