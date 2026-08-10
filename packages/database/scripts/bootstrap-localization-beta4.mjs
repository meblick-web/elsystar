import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log("[ELSYSTAR] Beta4 localization bootstrap skipped: DATABASE_URL is not configured.");
  process.exit(0);
}

const client = new Client({ connectionString });
await client.connect();

async function add(entityType, entityId, field, value) {
  if (!value) return;
  await client.query(`
    INSERT INTO "ContentTranslation" ("id", "locale", "entityType", "entityId", "field", "value", "createdAt", "updatedAt")
    VALUES (concat('tr_', md5($1 || ':' || $2 || ':' || $3 || ':en')), 'en', $1, $2, $3, $4, NOW(), NOW())
    ON CONFLICT ("locale", "entityType", "entityId", "field") DO NOTHING
  `, [entityType, entityId, field, value]);
}

async function addFields(entityType, entityId, fields) {
  for (const [field, value] of Object.entries(fields)) await add(entityType, entityId, field, value);
}

await addFields("HomepageContent", "homepage", {
  heroEyebrow: "INTELLIGENT TRANSPORT SYSTEMS",
  heroTitle: "Traffic controllers and traffic management systems",
  heroDescription: "We develop equipment and software solutions for safe and efficient management of urban transport infrastructure.",
  primaryCtaLabel: "Find a solution",
  secondaryCtaLabel: "Product catalog",
  trust1Label: "years of engineering expertise",
  trust2Value: "In-house",
  trust2Label: "equipment manufacturing",
  trust3Value: "End-to-end",
  trust3Label: "from controllers to ATMS",
  productsEyebrow: "PRODUCTS",
  productsTitle: "Core traffic controllers",
  solutionsEyebrow: "SOLUTIONS",
  solutionsTitle: "Everything required for traffic management",
  projectsEyebrow: "PROJECTS",
  projectsTitle: "Traffic management scenarios and deployments",
  supportEyebrow: "SUPPORT",
  supportTitle: "Documentation and engineering support in one place",
  supportDescription: "Quick access to manuals, certificates, software and current technical materials.",
  requestEyebrow: "CONTACT US",
  requestTitle: "Request a commercial proposal",
  requestDescription: "Describe your site, equipment requirements or integration task and leave your contact details."
});

await addFields("CorporateContent", "corporate", {
  companyName: "ELSYSTAR LLC",
  aboutEyebrow: "ABOUT ELSYSTAR",
  aboutTitle: "Engineering solutions for road traffic management",
  aboutLead: "ELSYSTAR develops and manufactures programmable traffic controllers and equipment for automated traffic management systems.",
  aboutBody: "The company was founded by road traffic controller engineers from Teleavtomatika. Its core products are traffic controllers and automated road traffic management systems. The UK-4.1M and UK-2.5 controllers build on decades of controller development and manufacturing experience.",
  historyTitle: "Engineering and deployment experience",
  historyBody: "The Megapolis automated traffic management system was developed and tested in Rostov-on-Don. ELSYSTAR's published materials state that the system covered 57 intersections in 2005 and 196 intersections in 2009.",
  productionEyebrow: "MANUFACTURING",
  productionTitle: "In-house equipment manufacturing",
  productionLead: "ELSYSTAR operates its own manufacturing facilities for traffic controllers and equipment used in automated road traffic management systems.",
  productionBody: "The manufacturing portfolio includes traffic controllers, interface modules for different controller types, and road traffic data acquisition modules. ELSYSTAR supplies individual components and subsystems as well as integrated traffic management solutions.",
  competenciesTitle: "Core competencies",
  supportTitle: "Technical support for equipment and software",
  supportBody: "The documentation center provides manuals, certificates, signal-plan preparation and loading utilities, and materials for the Megapolis platform.",
  legalName: "ELSYSTAR LLC"
});

const productTranslations = {
  "uk-4-1m": {
    name: "UK-4.1M Traffic Controller",
    shortDescription: "Universal traffic controller for local and networked control of signalized intersections.",
    description: "Designed to manage vehicle and pedestrian traffic. It can operate autonomously or as part of a centralized automated traffic management system.",
    seoTitle: "UK-4.1M Traffic Controller — ELSYSTAR",
    seoDescription: "ELSYSTAR UK-4.1M programmable traffic controller for local and networked traffic signal control."
  },
  "uk-2-5": {
    name: "UK-2.5 Traffic Controller",
    shortDescription: "Compact controller for local and networked management of vehicle and pedestrian traffic.",
    description: "Designed for signalized sites of lower complexity and compatible with solutions from the established UK-2 controller family.",
    seoTitle: "UK-2.5 Traffic Controller — ELSYSTAR",
    seoDescription: "Compact ELSYSTAR traffic controller for signalized intersections with up to 4 phases and up to 8 directions."
  }
};

for (const [slug, fields] of Object.entries(productTranslations)) await addFields("Product", slug, fields);

const categoryTranslations = {
  "road-controllers": { name: "Traffic controllers", description: "Programmable controllers for traffic signal installations." }
};
for (const [slug, fields] of Object.entries(categoryTranslations)) await addFields("ProductCategory", slug, fields);

const specTranslations = {
  "Число фаз движения": ["Traffic phases", null, null],
  "Число фаз": ["Traffic phases", null, null],
  "Число направлений": ["Directions", null, null],
  "Фиксированные программы": ["Fixed programs", null, null],
  "Силовые каналы": ["Power channels", null, null],
  "Максимальный ток канала": ["Maximum channel current", null, "A"],
  "Интерфейсы": ["Interfaces", null, null]
};
const specs = await client.query(`SELECT "id", "label", "value", "unit" FROM "ProductSpecification"`);
for (const row of specs.rows) {
  const translation = specTranslations[row.label];
  if (!translation) continue;
  await add("ProductSpecification", row.id, "label", translation[0]);
  if (row.value === "до 4") await add("ProductSpecification", row.id, "value", "up to 4");
  if (row.value === "до 8") await add("ProductSpecification", row.id, "value", "up to 8");
  if (translation[2]) await add("ProductSpecification", row.id, "unit", translation[2]);
}

const featureTranslations = {
  "Локальная и сетевая работа": ["Local and networked operation", "Autonomous operation or integration into a centralized traffic management system."],
  "Диагностика": ["Diagnostics", "Status monitoring, conflict detection and electronic event logging."],
  "Гибкая связь": ["Flexible communications", "Supports wired, radio and GPRS communication scenarios."],
  "Для объектов меньшей сложности": ["For lower-complexity sites", "A practical configuration for intersections with fewer directions and phases."],
  "Сетевая интеграция": ["Network integration", "Can be used as part of a centralized traffic management system."]
};
const features = await client.query(`SELECT "id", "title" FROM "ProductFeature"`);
for (const row of features.rows) {
  const translation = featureTranslations[row.title];
  if (!translation) continue;
  await add("ProductFeature", row.id, "title", translation[0]);
  await add("ProductFeature", row.id, "description", translation[1]);
}

const solutionTranslations = {
  "intersection-control": {
    name: "Intersection control",
    shortDescription: "Local and networked traffic-signal control with diagnostics and conflict monitoring.",
    description: "Traffic controllers and software tools for reliable control of vehicle and pedestrian movements at signalized intersections."
  },
  "megapolis": {
    name: "Megapolis ATMS",
    shortDescription: "Centralized monitoring, dispatching and management of an urban network of traffic-control sites.",
    description: "A distributed automated traffic management platform designed for centralized control, monitoring, coordination and integration with external systems."
  },
  "modernization": {
    name: "Infrastructure modernization",
    shortDescription: "Upgrade existing traffic-control sites to modern equipment and software without unnecessary replacement of the entire infrastructure.",
    description: "A phased modernization approach for existing intersections, communications and control-center infrastructure."
  }
};
for (const [slug, fields] of Object.entries(solutionTranslations)) await addFields("Solution", slug, fields);

const projectTranslations = {
  "demo-nalchik-smart-traffic": {
    title: "Demo case: intelligent transport system for Nalchik",
    summary: "Demonstration scenario for a comprehensive upgrade of urban intersections with adaptive control, monitoring and dispatching.",
    city: "Nalchik", region: "Kabardino-Balkaria",
    challenge: "Model an upgrade of busy urban intersections without replacing the entire existing infrastructure, combine controllers and detectors in one system, and provide transparent operational monitoring.",
    solutionText: "The demonstration uses ELSYSTAR traffic controllers, vehicle detectors, centralized monitoring and adaptive-control scenarios connected to a common event and remote-diagnostics layer.",
    result: "Modelled effect: up to 18% lower average delay, up to 14% fewer stops and faster fault diagnostics through centralized monitoring.",
    metric1Label: "intersections", metric2Label: "controllers", metric3Label: "modelled delay"
  },
  "demo-pyatigorsk-coordinated-control": {
    title: "Demo case: coordinated traffic control for Pyatigorsk",
    summary: "Demonstration project for coordinated arterial control, public-transport priority and centralized supervision in a resort city.",
    city: "Pyatigorsk", region: "Stavropol Krai",
    challenge: "Model a city with seasonal demand, varying traffic intensity and a requirement for predictable travel times along key corridors.",
    solutionText: "The scenario combines coordinated timing plans, networked controllers, detector data and an operator dashboard for modes and events.",
    result: "Modelled result: up to 16% shorter travel time along the primary corridor and more stable peak-hour traffic distribution.",
    metric1Label: "intersections", metric2Label: "controllers", metric3Label: "travel time"
  },
  "demo-minvody-transport-hub": {
    title: "Demo case: Mineralnye Vody transport hub",
    summary: "Demonstration scenario for signalized sites around a transport hub with monitoring and remote diagnostics.",
    city: "Mineralnye Vody", region: "Stavropol Krai",
    challenge: "Model a transport hub with sharp demand peaks, through traffic and increased equipment-availability requirements.",
    solutionText: "The scenario uses traffic controllers, resilient communication channels, vehicle detectors and centralized event logging with operational equipment monitoring.",
    result: "Modelled effect: up to 20% lower peak queues and faster equipment diagnostics through a unified monitoring center.",
    metric1Label: "sites", metric2Label: "controllers", metric3Label: "peak queues"
  },
  "demo-krasnodar-urban-its": {
    title: "Demo case: urban ITS architecture for Krasnodar",
    summary: "Extended demonstration of an urban ITS with adaptive control, dispatching and event analytics.",
    city: "Krasnodar", region: "Krasnodar Krai",
    challenge: "Demonstrate a scalable city architecture that can grow by adding controllers, detectors and subsystems without stopping the active network.",
    solutionText: "The model combines local controllers, telemetry, a centralized server, operator workstations and a unified event log in an architecture designed for phased expansion.",
    result: "Demonstration KPI: unified network visibility, fewer manual operator actions and centralized management of control plans.",
    metric1Label: "sites", metric2Label: "controllers", metric3Label: "monitoring"
  }
};
for (const [slug, fields] of Object.entries(projectTranslations)) await addFields("Project", slug, fields);

const faqTranslations = {
  "Где скачать руководства и сертификаты?": ["Where can I download manuals and certificates?", "Current manuals, certificates and technical materials are available in the Documentation section. Document series include version history when available."],
  "Где получить программное обеспечение и прошивки?": ["Where can I obtain software and firmware?", "Published software, firmware and accompanying materials are available in the documentation center. Contact technical support if the required version is not publicly available."],
  "Как запросить коммерческое предложение?": ["How can I request a commercial proposal?", "Use the request form on the website and describe the site, equipment or engineering task. The request will be sent to the ELSYSTAR commercial team."]
};
const faqs = await client.query(`SELECT "id", "question" FROM "FaqEntry"`);
for (const row of faqs.rows) {
  const translation = faqTranslations[row.question];
  if (!translation) continue;
  await add("FaqEntry", row.id, "question", translation[0]);
  await add("FaqEntry", row.id, "answer", translation[1]);
}

await client.query(`INSERT INTO "AuditLog" ("id", "actorEmail", "action", "entityType", "entityId", "payload", "createdAt") VALUES (concat('audit_', md5(random()::text || clock_timestamp()::text)), 'system', 'content.bootstrap.beta4_localization', 'ContentTranslation', 'en', $1::jsonb, NOW())`, [JSON.stringify({ locale: "en", strategy: "insert-missing-only" })]);
await client.end();
console.log("[ELSYSTAR] Beta4 English localization defaults synchronized without overwriting editor changes.");
