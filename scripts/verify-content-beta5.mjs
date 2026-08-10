import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[ELSYSTAR CONTENT] DATABASE_URL is required.");
  process.exit(2);
}

const client = new Client({ connectionString });
await client.connect();
const errors = [];

async function scalar(sql, params = []) {
  const result = await client.query(sql, params);
  return Number(Object.values(result.rows[0] ?? {})[0] ?? 0);
}

async function expectCount(label, sql, minimum, params = []) {
  const count = await scalar(sql, params);
  if (count < minimum) errors.push(`${label}: expected >= ${minimum}, got ${count}`);
  else console.log(`[ELSYSTAR CONTENT] ${label}: ${count}`);
}

try {
  await expectCount("product categories", `SELECT COUNT(*)::int FROM "ProductCategory"`, 5);
  await expectCount("published products", `SELECT COUNT(*)::int FROM "Product" WHERE "status"='PUBLISHED'`, 11);
  await expectCount("UK-4.1M configurations", `SELECT COUNT(*)::int FROM "ProductConfiguration" pc JOIN "Product" p ON p."id"=pc."productId" WHERE p."slug"='uk-4-1m'`, 6);
  await expectCount("UK-2.5 configurations", `SELECT COUNT(*)::int FROM "ProductConfiguration" pc JOIN "Product" p ON p."id"=pc."productId" WHERE p."slug"='uk-2-5'`, 1);
  await expectCount("UK-4.1M relations", `SELECT COUNT(*)::int FROM "ProductRelation" r JOIN "Product" p ON p."id"=r."sourceProductId" WHERE p."slug"='uk-4-1m'`, 9);
  await expectCount("published solutions", `SELECT COUNT(*)::int FROM "Solution" WHERE "status"='PUBLISHED'`, 6);
  await expectCount("document series", `SELECT COUNT(*)::int FROM "DocumentSeries"`, 9);
  await expectCount("public current document versions", `SELECT COUNT(*)::int FROM "Document" WHERE "isPublic"=true AND "isCurrent"=true AND "publishedAt" IS NOT NULL`, 9);
  await expectCount("English primary catalog translations", `SELECT COUNT(*)::int FROM "ContentTranslation" WHERE "locale"='en' AND "field" IN ('name','title')`, 12);
  await expectCount("beta5 audit marker", `SELECT COUNT(*)::int FROM "AuditLog" WHERE "action"='content.bootstrap.beta5' AND "entityType"='System' AND "entityId"='verified-catalog-content-v1'`, 1);

  const prices = await scalar(`SELECT COUNT(*)::int FROM "ProductConfiguration" WHERE "description" ~* '(цена|руб\\.?|₽|price)'`);
  if (prices !== 0) errors.push(`configuration descriptions unexpectedly contain price-like text: ${prices}`);

  const unverifiedCorporate = await client.query(`SELECT "address","inn","kpp","ogrn" FROM "CorporateContent" WHERE "id"='corporate'`);
  const row = unverifiedCorporate.rows[0];
  if (row && [row.address, row.inn, row.kpp, row.ogrn].some(Boolean)) errors.push("beta bootstrap unexpectedly populated unverified corporate address/requisites");
} finally {
  await client.end();
}

if (errors.length) {
  for (const error of errors) console.error(`[ELSYSTAR CONTENT] ERROR: ${error}`);
  process.exit(1);
}
console.log("[ELSYSTAR CONTENT] beta5 CMS bootstrap verification passed.");
