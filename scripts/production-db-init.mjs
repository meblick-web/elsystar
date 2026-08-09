import { spawnSync } from "node:child_process";
import pg from "pg";

const { Client } = pg;
const connectionString = (process.env.DATABASE_URL || "").trim();
const confirmed = process.env.ELSYSTAR_PRODUCTION_INIT === "YES";

if (!confirmed) {
  console.error("[ELSYSTAR] Refusing production DB initialization. Set ELSYSTAR_PRODUCTION_INIT=YES explicitly.");
  process.exit(2);
}
if (!connectionString) {
  console.error("[ELSYSTAR] DATABASE_URL is required for production DB initialization.");
  process.exit(2);
}

const client = new Client({ connectionString });
await client.connect();
let tables;
try {
  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  tables = result.rows.map((row) => String(row.table_name));
} finally {
  await client.end();
}

if (tables.length) {
  console.error(`[ELSYSTAR] Production DB initialization stopped: public schema already contains ${tables.length} table(s).`);
  console.error("[ELSYSTAR] No schema or content changes were applied. Use an explicit reviewed migration path for an existing database.");
  console.error(`[ELSYSTAR] Existing tables: ${tables.slice(0, 12).join(", ")}${tables.length > 12 ? ", …" : ""}`);
  process.exit(3);
}

function run(label, command, args) {
  console.log(`[ELSYSTAR] ${label}...`);
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`[ELSYSTAR] ${label} failed with exit code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

run("Creating schema in clean production database", "npm", ["run", "db:push"]);
run("Importing verified visible content", "node", ["packages/database/scripts/bootstrap-visible-content.mjs"]);
run("Applying CMS QA content migration", "node", ["packages/database/scripts/bootstrap-content-qa-alpha9-3.mjs"]);
run("Applying SEO defaults and legacy redirects", "node", ["packages/database/scripts/bootstrap-seo-beta2.mjs"]);

console.log("[ELSYSTAR] Clean production database initialization completed.");
console.log("[ELSYSTAR] Future schema changes must use a reviewed migration strategy; do not rerun this initializer on an existing database.");
