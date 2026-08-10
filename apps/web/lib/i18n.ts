import { isDatabaseConfigured, prisma } from "@elsystar/database";

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

export const uiEn = {
  products: "Products",
  solutions: "Solutions",
  projects: "Projects",
  documentation: "Documentation",
  about: "About",
  contacts: "Contacts",
  production: "Manufacturing",
  faq: "FAQ",
  requestQuote: "Request a quote",
  details: "Learn more →",
  allProducts: "All products →",
  allSolutions: "All solutions →",
  allProjects: "All projects →",
  platform: "PLATFORM",
  aboutSystem: "About the system →",
  demoCase: "Demo case",
  projectFallback: "ELSYSTAR project",
  support: "Support",
  contactUs: "Contact us",
  catalog: "Catalog",
  company: "Company",
  download: "Download",
  open: "Open ↗",
};
