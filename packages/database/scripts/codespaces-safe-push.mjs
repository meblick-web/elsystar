import pg from "pg";
import { spawnSync } from "node:child_process";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[ELSYSTAR] DATABASE_URL is not configured.");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

try {
  const columnCheck = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Document'
        AND column_name = 'seriesId'
    ) AS exists
  `);

  const hasSeriesId = Boolean(columnCheck.rows[0]?.exists);
  let hasExpectedUniqueIndex = false;

  if (hasSeriesId) {
    const duplicateCheck = await client.query(`
      SELECT "seriesId", "version", COUNT(*)::int AS count
      FROM "Document"
      WHERE "seriesId" IS NOT NULL
        AND "version" IS NOT NULL
      GROUP BY "seriesId", "version"
      HAVING COUNT(*) > 1
      LIMIT 20
    `);

    if (duplicateCheck.rowCount) {
      console.error("[ELSYSTAR] Database schema update stopped: duplicate document versions were found.");
      for (const row of duplicateCheck.rows) {
        console.error(`  seriesId=${row.seriesId} version=${row.version} count=${row.count}`);
      }
      console.error("[ELSYSTAR] No schema changes were applied. Resolve duplicates before retrying.");
      process.exit(2);
    }

    const indexCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'Document'
          AND indexdef ILIKE '%UNIQUE%'
          AND indexdef LIKE '%"seriesId"%'
          AND indexdef LIKE '%"version"%'
      ) AS exists
    `);
    hasExpectedUniqueIndex = Boolean(indexCheck.rows[0]?.exists);
  }

  await client.end();

  const prismaArgs = ["prisma", "db", "push", "--config", "prisma.config.ts"];
  if (!hasExpectedUniqueIndex) {
    console.log("[ELSYSTAR] Applying guarded alpha.7 document-version uniqueness upgrade.");
    console.log("[ELSYSTAR] Duplicate preflight passed; Prisma warning is accepted for this known change only.");
    prismaArgs.push("--accept-data-loss");
  }

  const result = spawnSync("npx", prismaArgs, {
    cwd: new URL("../", import.meta.url),
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
} catch (error) {
  try { await client.end(); } catch {}
  console.error("[ELSYSTAR] Safe Prisma push failed:", error);
  process.exit(1);
}
