import { isDatabaseConfigured, prisma } from "@elsystar/database";
import type { PublicProduct, PublicProductCategory } from "./products";
import type { PublicProject, PublicSolution } from "./content";
import type { PublicCorporateMedia, PublicCompetency, PublicFaqEntry } from "./corporate";

export type PublicLocale = "ru" | "en";
export type TranslationMap = Map<string, string>;

function key(entityType: string, entityId: string, field: string) {
  return `${entityType}:${entityId}:${field}`;
}

const fallbackEntries: Array<[string, string, string, string]> = [
  ["HomepageContent", "homepage", "heroEyebrow", "INTELLIGENT TRANSPORT SYSTEMS"],
  ["HomepageContent", "homepage", "heroTitle", "Traffic controllers and traffic management systems"],
  ["HomepageContent", "homepage", "heroDescription", "We develop equipment and software solutions for safe and efficient management of urban transport infrastructure."],
  ["HomepageContent", "homepage", "primaryCtaLabel", "Find a solution"],
  ["HomepageContent", "homepage", "secondaryCtaLabel", "Product catalog"],
  ["HomepageContent", "homepage", "trust1Label", "years of engineering expertise"],
  ["HomepageContent", "homepage", "trust2Value", "In-house"],
  ["HomepageContent", "homepage", "trust2Label", "equipment manufacturing"],
  ["HomepageContent", "homepage", "trust3Value", "End-to-end"],
  ["HomepageContent", "homepage", "trust3Label", "from controllers to ATMS"],
  ["HomepageContent", "homepage", "productsEyebrow", "PRODUCTS"],
  ["HomepageContent", "homepage", "productsTitle", "Core traffic controllers"],
  ["HomepageContent", "homepage", "solutionsEyebrow", "SOLUTIONS"],
  ["HomepageContent", "homepage", "solutionsTitle", "Everything required for traffic management"],
  ["HomepageContent", "homepage", "projectsEyebrow", "PROJECTS"],
  ["HomepageContent", "homepage", "projectsTitle", "Traffic management scenarios and deployments"],
  ["HomepageContent", "homepage", "supportEyebrow", "SUPPORT"],
  ["HomepageContent", "homepage", "supportTitle", "Documentation and engineering support in one place"],
  ["HomepageContent", "homepage", "supportDescription", "Quick access to manuals, certificates, software and current technical materials."],
  ["HomepageContent", "homepage", "requestEyebrow", "CONTACT US"],
  ["HomepageContent", "homepage", "requestTitle", "Request a commercial proposal"],
  ["HomepageContent", "homepage", "requestDescription", "Describe your site, equipment requirements or integration task and leave your contact details."],
  ["CorporateContent", "corporate", "companyName", "ELSYSTAR LLC"],
  ["CorporateContent", "corporate", "aboutEyebrow", "ABOUT ELSYSTAR"],
  ["CorporateContent", "corporate", "aboutTitle", "Engineering solutions for road traffic management"],
  ["CorporateContent", "corporate", "aboutLead", "ELSYSTAR develops and manufactures programmable traffic controllers and equipment for automated traffic management systems."],
  ["CorporateContent", "corporate", "aboutBody", "The company was founded by road traffic controller engineers from Teleavtomatika. Its core products are traffic controllers and automated road traffic management systems. The UK-4.1M and UK-2.5 controllers build on decades of controller development and manufacturing experience."],
  ["CorporateContent", "corporate", "historyTitle", "Engineering and deployment experience"],
  ["CorporateContent", "corporate", "historyBody", "The Megapolis automated traffic management system was developed and tested in Rostov-on-Don. Published ELSYSTAR materials state that the system covered 57 intersections in 2005 and 196 intersections in 2009."],
  ["CorporateContent", "corporate", "productionEyebrow", "MANUFACTURING"],
  ["CorporateContent", "corporate", "productionTitle", "In-house equipment manufacturing"],
  ["CorporateContent", "corporate", "productionLead", "ELSYSTAR operates its own manufacturing facilities for traffic controllers and equipment used in automated road traffic management systems."],
  ["CorporateContent", "corporate", "productionBody", "The manufacturing portfolio includes traffic controllers, interface modules for different controller types, and road traffic data acquisition modules. ELSYSTAR supplies individual components and subsystems as well as integrated traffic management solutions."],
  ["CorporateContent", "corporate", "competenciesTitle", "Core competencies"],
  ["CorporateContent", "corporate", "supportTitle", "Technical support for equipment and software"],
  ["CorporateContent", "corporate", "supportBody", "The documentation center provides manuals, certificates, signal-plan preparation and loading utilities, and materials for the Megapolis platform."],
  ["Product", "uk-4-1m", "name", "UK-4.1M Traffic Controller"],
  ["Product", "uk-4-1m", "shortDescription", "Universal traffic controller for local and networked control of signalized intersections."],
  ["Product", "uk-4-1m", "description", "Designed to manage vehicle and pedestrian traffic. It can operate autonomously or as part of a centralized automated traffic management system."],
  ["Product", "uk-2-5", "name", "UK-2.5 Traffic Controller"],
  ["Product", "uk-2-5", "shortDescription", "Compact controller for local and networked management of vehicle and pedestrian traffic."],
  ["Product", "uk-2-5", "description", "Designed for signalized sites of lower complexity and compatible with solutions from the established UK-2 controller family."],
  ["ProductCategory", "road-controllers", "name", "Traffic controllers"],
  ["ProductCategory", "road-controllers", "description", "Programmable controllers for traffic signal installations."],
  ["Solution", "intersection-control", "name", "Intersection control"],
  ["Solution", "intersection-control", "shortDescription", "Local and networked traffic-signal control with diagnostics and conflict monitoring."],
  ["Solution", "megapolis", "name", "Megapolis ATMS"],
  ["Solution", "megapolis", "shortDescription", "Centralized monitoring, dispatching and management of an urban network of traffic-control sites."],
  ["Solution", "modernization", "name", "Infrastructure modernization"],
  ["Solution", "modernization", "shortDescription", "Upgrade existing traffic-control sites to modern equipment and software without unnecessary replacement of the entire infrastructure."],
  ["Project", "demo-nalchik-smart-traffic", "title", "Demo case: intelligent transport system for Nalchik"],
  ["Project", "demo-nalchik-smart-traffic", "summary", "Demonstration scenario for a comprehensive upgrade of urban intersections with adaptive control, monitoring and dispatching."],
  ["Project", "demo-pyatigorsk-coordinated-control", "title", "Demo case: coordinated traffic control for Pyatigorsk"],
  ["Project", "demo-pyatigorsk-coordinated-control", "summary", "Demonstration project for coordinated arterial control, public-transport priority and centralized supervision in a resort city."],
  ["Project", "demo-minvody-transport-hub", "title", "Demo case: Mineralnye Vody transport hub"],
  ["Project", "demo-minvody-transport-hub", "summary", "Demonstration scenario for signalized sites around a transport hub with monitoring and remote diagnostics."],
  ["Project", "demo-krasnodar-urban-its", "title", "Demo case: urban ITS architecture for Krasnodar"],
  ["Project", "demo-krasnodar-urban-its", "summary", "Extended demonstration of an urban ITS with adaptive control, dispatching and event analytics."],
  ["ProductSpecification", "uk41-phases", "label", "Traffic phases"],
  ["ProductSpecification", "uk41-directions", "label", "Directions"],
  ["ProductSpecification", "uk41-programs", "label", "Fixed programs"],
  ["ProductSpecification", "uk41-channels", "label", "Power channels"],
  ["ProductSpecification", "uk41-current", "label", "Maximum channel current"],
  ["ProductSpecification", "uk41-current", "unit", "A"],
  ["ProductSpecification", "uk41-interfaces", "label", "Interfaces"],
  ["ProductSpecification", "uk25-phases", "label", "Traffic phases"],
  ["ProductSpecification", "uk25-phases", "value", "up to 4"],
  ["ProductSpecification", "uk25-directions", "label", "Directions"],
  ["ProductSpecification", "uk25-directions", "value", "up to 8"],
  ["ProductSpecification", "uk25-channels", "label", "Power channels"],
  ["ProductFeature", "uk41-feature-network", "title", "Local and networked operation"],
  ["ProductFeature", "uk41-feature-network", "description", "Autonomous operation or integration into a centralized traffic management system."],
  ["ProductFeature", "uk41-feature-diagnostics", "title", "Diagnostics"],
  ["ProductFeature", "uk41-feature-diagnostics", "description", "Status monitoring, conflict detection and electronic event logging."],
  ["ProductFeature", "uk41-feature-comms", "title", "Flexible communications"],
  ["ProductFeature", "uk41-feature-comms", "description", "Supports wired, radio and GPRS communication scenarios."],
  ["ProductFeature", "uk25-feature-compact", "title", "For lower-complexity sites"],
  ["ProductFeature", "uk25-feature-compact", "description", "A practical configuration for intersections with fewer directions and phases."],
  ["ProductFeature", "uk25-feature-network", "title", "Network integration"],
  ["ProductFeature", "uk25-feature-network", "description", "Can be used as part of a centralized traffic management system."],
];

const fallbackMap = new Map(fallbackEntries.map(([entityType, entityId, field, value]) => [key(entityType, entityId, field), value]));

export async function getTranslationMap(locale: PublicLocale = "en"): Promise<TranslationMap> {
  const result = new Map(fallbackMap);
  if (locale === "ru" || !isDatabaseConfigured() || !prisma) return locale === "ru" ? new Map() : result;
  try {
    const rows = await prisma.contentTranslation.findMany({ where: { locale }, select: { entityType: true, entityId: true, field: true, value: true } });
    for (const row of rows) result.set(key(row.entityType, row.entityId, row.field), row.value);
  } catch (error) {
    console.error("content_translation_query_failed", error);
  }
  return result;
}

export function tr(map: TranslationMap, entityType: string, entityId: string, field: string, fallback: string | null | undefined) {
  return map.get(key(entityType, entityId, field)) ?? fallback ?? "";
}

export function hasTranslation(map: TranslationMap, entityType: string, entityId: string, field = "name") {
  return map.has(key(entityType, entityId, field));
}

export function localePath(locale: PublicLocale, path: string) {
  if (locale === "ru") return path.startsWith("/en/") ? path.slice(3) : path === "/en" ? "/" : path;
  if (path === "/") return "/en";
  if (path.startsWith("/en")) return path;
  return `/en${path.startsWith("/") ? path : `/${path}`}`;
}

export function localizeHomepage<T extends Record<string, unknown>>(content: T, map: TranslationMap): T {
  const fields = ["heroEyebrow","heroTitle","heroDescription","primaryCtaLabel","secondaryCtaLabel","trust1Label","trust2Value","trust2Label","trust3Value","trust3Label","productsEyebrow","productsTitle","solutionsEyebrow","solutionsTitle","projectsEyebrow","projectsTitle","supportEyebrow","supportTitle","supportDescription","requestEyebrow","requestTitle","requestDescription"];
  const copy: Record<string, unknown> = { ...content };
  for (const field of fields) copy[field] = tr(map, "HomepageContent", "homepage", field, String(content[field] ?? ""));
  copy.primaryCtaHref = localePath("en", String(content.primaryCtaHref ?? "/solutions"));
  copy.secondaryCtaHref = localePath("en", String(content.secondaryCtaHref ?? "/products"));
  return copy as T;
}

export function localizeCategory(category: PublicProductCategory | null, map: TranslationMap): PublicProductCategory | null {
  if (!category) return null;
  return {
    ...category,
    name: tr(map, "ProductCategory", category.slug, "name", category.name),
    description: tr(map, "ProductCategory", category.slug, "description", category.description) || null,
    parent: category.parent ? { ...category.parent, name: tr(map, "ProductCategory", category.parent.slug, "name", category.parent.name) } : null,
  };
}

export function localizeProduct(product: PublicProduct, map: TranslationMap): PublicProduct {
  return {
    ...product,
    name: tr(map, "Product", product.slug, "name", product.name),
    shortDescription: tr(map, "Product", product.slug, "shortDescription", product.shortDescription),
    description: tr(map, "Product", product.slug, "description", product.description) || null,
    seoTitle: tr(map, "Product", product.slug, "seoTitle", product.seoTitle) || null,
    seoDescription: tr(map, "Product", product.slug, "seoDescription", product.seoDescription) || null,
    category: product.category ? { ...product.category, name: tr(map, "ProductCategory", product.category.slug, "name", product.category.name), parent: product.category.parent ? { ...product.category.parent, name: tr(map, "ProductCategory", product.category.slug, "parentName", product.category.parent.name) } : null } : null,
    specifications: product.specifications.map((item) => ({ ...item, label: tr(map, "ProductSpecification", item.id, "label", item.label), value: tr(map, "ProductSpecification", item.id, "value", item.value), unit: tr(map, "ProductSpecification", item.id, "unit", item.unit) || null })),
    features: product.features.map((item) => ({ ...item, title: tr(map, "ProductFeature", item.id, "title", item.title), description: tr(map, "ProductFeature", item.id, "description", item.description) || null })),
    configurations: product.configurations.map((item) => ({ ...item, name: tr(map, "ProductConfiguration", item.id, "name", item.name), description: tr(map, "ProductConfiguration", item.id, "description", item.description) || null })),
    solutions: product.solutions.map((item) => ({ ...item, name: tr(map, "Solution", item.slug, "name", item.name), shortDescription: tr(map, "Solution", item.slug, "shortDescription", item.shortDescription) })),
    projects: product.projects.map((item) => ({ ...item, title: tr(map, "Project", item.slug, "title", item.title), city: item.city ? tr(map, "Project", item.slug, "city", item.city) : null })),
    relatedProducts: product.relatedProducts.map((relation) => ({ ...relation, product: { ...relation.product, name: tr(map, "Product", relation.product.slug, "name", relation.product.name), shortDescription: tr(map, "Product", relation.product.slug, "shortDescription", relation.product.shortDescription) } })),
  };
}

export function localizeSolution(solution: PublicSolution, map: TranslationMap): PublicSolution {
  return {
    ...solution,
    name: tr(map, "Solution", solution.slug, "name", solution.name),
    shortDescription: tr(map, "Solution", solution.slug, "shortDescription", solution.shortDescription),
    description: tr(map, "Solution", solution.slug, "description", solution.description) || null,
    seoTitle: tr(map, "Solution", solution.slug, "seoTitle", solution.seoTitle) || null,
    seoDescription: tr(map, "Solution", solution.slug, "seoDescription", solution.seoDescription) || null,
  };
}

export function localizeProject(project: PublicProject, map: TranslationMap): PublicProject {
  return {
    ...project,
    title: tr(map, "Project", project.slug, "title", project.title),
    summary: tr(map, "Project", project.slug, "summary", project.summary),
    city: project.city ? tr(map, "Project", project.slug, "city", project.city) : null,
    region: project.region ? tr(map, "Project", project.slug, "region", project.region) : null,
    challenge: tr(map, "Project", project.slug, "challenge", project.challenge) || null,
    solutionText: tr(map, "Project", project.slug, "solutionText", project.solutionText) || null,
    result: tr(map, "Project", project.slug, "result", project.result) || null,
    seoTitle: tr(map, "Project", project.slug, "seoTitle", project.seoTitle) || null,
    seoDescription: tr(map, "Project", project.slug, "seoDescription", project.seoDescription) || null,
    metrics: project.metrics.map((metric, index) => ({ ...metric, label: tr(map, "Project", project.slug, `metric${index + 1}Label`, metric.label) })),
  };
}

export function localizeCorporate<T extends { competencies: PublicCompetency[]; media: PublicCorporateMedia[] } & Record<string, unknown>>(content: T, map: TranslationMap): T {
  const fields = ["companyName","aboutEyebrow","aboutTitle","aboutLead","aboutBody","historyTitle","historyBody","productionEyebrow","productionTitle","productionLead","productionBody","competenciesTitle","supportTitle","supportBody","legalName","workingHours"];
  const copy: Record<string, unknown> = { ...content };
  for (const field of fields) copy[field] = tr(map, "CorporateContent", "corporate", field, typeof content[field] === "string" ? content[field] as string : "") || content[field];
  copy.competencies = content.competencies.map((item) => ({ ...item, title: tr(map, "CorporateCompetency", item.id, "title", item.title), description: tr(map, "CorporateCompetency", item.id, "description", item.description) || null }));
  return copy as T;
}

export function localizeFaq(entry: PublicFaqEntry, map: TranslationMap): PublicFaqEntry {
  return { ...entry, question: tr(map, "FaqEntry", entry.id, "question", entry.question), answer: tr(map, "FaqEntry", entry.id, "answer", entry.answer) };
}

export const uiEn = {
  products: "Products", solutions: "Solutions", projects: "Projects", documentation: "Documentation", about: "About", contacts: "Contacts", production: "Manufacturing", faq: "FAQ",
  requestQuote: "Request a quote", details: "Learn more →", allProducts: "All products →", allSolutions: "All solutions →", allProjects: "All projects →", platform: "PLATFORM", aboutSystem: "About the system →",
  demoCase: "Demo case", projectFallback: "ELSYSTAR project", support: "Support", contactUs: "Contact us", catalog: "Catalog", company: "Company", download: "Download", open: "Open ↗",
};
