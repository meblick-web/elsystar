import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.log("[ELSYSTAR] SEO bootstrap skipped: DATABASE_URL is not configured.");
  process.exit(0);
}

const client = new Client({ connectionString });
await client.connect();

const routes = [
  ["/", "ELSYSTAR — Интеллектуальные транспортные системы и АСУДД", "Дорожные контроллеры, АСУДТ «Мегаполис», программное обеспечение и инженерные решения ELSYSTAR для управления дорожным движением."],
  ["/products", "Продукция ELSYSTAR — дорожные контроллеры и оборудование АСУДД", "Каталог дорожных контроллеров и оборудования ELSYSTAR для светофорных объектов и автоматизированных систем управления дорожным движением."],
  ["/solutions", "Решения ELSYSTAR — АСУДД и управление дорожным движением", "Решения ELSYSTAR для управления перекрёстками, централизованной диспетчеризации, АСУДТ «Мегаполис» и модернизации дорожной инфраструктуры."],
  ["/projects", "Проекты ELSYSTAR — решения для транспортной инфраструктуры", "Проекты и сценарии применения дорожных контроллеров, АСУДД и программных решений ELSYSTAR."],
  ["/support", "Документация и поддержка ELSYSTAR", "Руководства, сертификаты, программное обеспечение, прошивки и технические материалы ELSYSTAR с актуальными версиями."],
  ["/about", "О компании ELSYSTAR — дорожные контроллеры и АСУДД", "ELSYSTAR: разработка и производство дорожных контроллеров, оборудования и программных решений для автоматизированного управления дорожным движением."],
  ["/production", "Производство ELSYSTAR — дорожные контроллеры и оборудование АСУДД", "Собственное производство ELSYSTAR: дорожные контроллеры, модули сопряжения и оборудование для систем управления дорожным движением."],
  ["/contacts", "Контакты ELSYSTAR — консультация по дорожным контроллерам и АСУДД", "Контакты ELSYSTAR для консультаций по дорожным контроллерам, АСУДТ «Мегаполис», документации и коммерческим предложениям."],
  ["/faq", "FAQ ELSYSTAR — оборудование, ПО и техническая поддержка", "Ответы на вопросы о дорожных контроллерах ELSYSTAR, АСУДТ «Мегаполис», документации, программном обеспечении и коммерческих предложениях."],
];

const redirects = [
  ["/index.html", "/"],
  ["/production.html", "/production"],
  ["/support.html", "/support"],
  ["/software.html", "/solutions/megapolis"],
  ["/price.html", "/products"],
];

try {
  await client.query("BEGIN");
  for (const [path, title, description] of routes) {
    await client.query(`
      INSERT INTO "SeoRoute" ("id","path","title","description","indexable","follow","createdAt","updatedAt")
      VALUES ($1,$2,$3,$4,true,true,NOW(),NOW())
      ON CONFLICT ("path") DO NOTHING
    `, [`beta2-seo-${path === "/" ? "home" : path.slice(1).replaceAll("/", "-")}`, path, title, description]);
  }

  for (const [fromPath, toPath] of redirects) {
    await client.query(`
      INSERT INTO "RedirectRule" ("id","fromPath","toPath","status","enabled","createdAt","updatedAt")
      VALUES ($1,$2,$3,301,true,NOW(),NOW())
      ON CONFLICT ("fromPath") DO NOTHING
    `, [`beta2-redirect-${fromPath.slice(1).replaceAll(/[^a-z0-9]+/gi, "-")}`, fromPath, toPath]);
  }

  await client.query(`
    INSERT INTO "AuditLog" ("id","actorEmail","action","entityType","entityId","payload","createdAt")
    VALUES ($1,'system','seo.bootstrap.beta2','System','seo-migration-v1',$2::jsonb,NOW())
  `, [`beta2-seo-audit-${Date.now()}`, JSON.stringify({ routes: routes.length, redirects: redirects.length })]);
  await client.query("COMMIT");
  console.log(`[ELSYSTAR] SEO bootstrap ready: ${routes.length} route defaults, ${redirects.length} legacy redirects checked.`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("[ELSYSTAR] SEO bootstrap failed.", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
