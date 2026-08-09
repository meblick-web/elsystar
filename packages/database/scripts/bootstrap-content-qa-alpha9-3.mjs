import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
const MARKER_ACTION = "content.bootstrap.alpha9_3";
const MARKER_ENTITY = "content-visual-qa-v1";

if (!connectionString) {
  console.log("[ELSYSTAR] Alpha9.3 content QA bootstrap skipped: DATABASE_URL is not configured.");
  process.exit(0);
}

const client = new Client({ connectionString });
await client.connect();

try {
  const marker = await client.query(`
    SELECT "id" FROM "AuditLog"
    WHERE "action"=$1 AND "entityType"='System' AND "entityId"=$2
    LIMIT 1
  `, [MARKER_ACTION, MARKER_ENTITY]);

  if (marker.rowCount) {
    console.log("[ELSYSTAR] Alpha9.3 CMS QA bootstrap already applied; nothing to do.");
    await client.end();
    process.exit(0);
  }

  await client.query("BEGIN");

  const demoProjects = [
    ["demo-nalchik-smart-traffic", "42", "перекрёстка", "126", "контроллеров", "−18%", "расчётная задержка"],
    ["demo-pyatigorsk-coordinated-control", "28", "перекрёстков", "84", "контроллера", "−16%", "время в пути"],
    ["demo-minvody-transport-hub", "24", "объекта", "72", "контроллера", "−20%", "пиковые очереди"],
    ["demo-krasnodar-urban-its", "60+", "объектов", "180", "контроллеров", "24/7", "мониторинг"],
  ];

  for (const [slug, metric1Value, metric1Label, metric2Value, metric2Label, metric3Value, metric3Label] of demoProjects) {
    await client.query(`
      UPDATE "Project"
      SET "isDemo"=true,
          "metric1Value"=COALESCE("metric1Value", $2),
          "metric1Label"=COALESCE("metric1Label", $3),
          "metric2Value"=COALESCE("metric2Value", $4),
          "metric2Label"=COALESCE("metric2Label", $5),
          "metric3Value"=COALESCE("metric3Value", $6),
          "metric3Label"=COALESCE("metric3Label", $7),
          "updatedAt"=NOW()
      WHERE "slug"=$1
    `, [slug, metric1Value, metric1Label, metric2Value, metric2Label, metric3Value, metric3Label]);
  }

  await client.query(`
    INSERT INTO "AuditLog" ("id","actorEmail","action","entityType","entityId","payload","createdAt")
    VALUES (
      'bootstrap-alpha9-3-' || substr(md5(random()::text),1,16),
      'system@elsystar.local',$1,'System',$2,
      '{"scope":"homepage-fields-project-demo-kpis"}'::jsonb,NOW()
    )
  `, [MARKER_ACTION, MARKER_ENTITY]);

  await client.query("COMMIT");
  console.log("[ELSYSTAR] Alpha9.3 CMS fields and demo KPI data synchronized.");
} catch (error) {
  try { await client.query("ROLLBACK"); } catch {}
  console.error("[ELSYSTAR] Alpha9.3 CMS QA bootstrap failed:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
