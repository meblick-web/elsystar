import fs from "node:fs";
import path from "node:path";

const root = JSON.parse(fs.readFileSync("package.json", "utf8"));
const expectedVersion = root.version;
const errors = [];
const warnings = [];

for (const file of ["apps/web/package.json", "apps/admin/package.json", "packages/database/package.json"]) {
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  if (pkg.version !== expectedVersion) errors.push(`${file} version ${pkg.version} does not match root ${expectedVersion}`);
}

for (const file of [
  "apps/web/app/api/health/route.ts",
  "apps/admin/app/api/health/route.ts",
  "apps/web/app/robots.ts",
  "apps/admin/app/robots.ts",
  "apps/web/app/sitemap.ts",
  "scripts/production-db-init.mjs",
  "scripts/smoke-production.sh",
  "docs/RELEASE-CHECKLIST.md",
]) {
  if (!fs.existsSync(file)) errors.push(`required release file is missing: ${file}`);
}

const webPackage = JSON.parse(fs.readFileSync("apps/web/package.json", "utf8"));
const adminPackage = JSON.parse(fs.readFileSync("apps/admin/package.json", "utf8"));
if (!String(webPackage.scripts?.start || "").includes("PORT")) errors.push("public production start command must honor PORT");
if (!String(adminPackage.scripts?.start || "").includes("PORT")) errors.push("admin production start command must honor PORT");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".next", "node_modules"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const publicFiles = walk("apps/web");
for (const file of publicFiles) {
  const source = fs.readFileSync(file, "utf8");
  if (source.includes("codespaces-preview-only")) errors.push(`preview credential leaked into public source: ${file}`);
  if (source.includes("RU / EN")) warnings.push(`inactive RU / EN label remains in ${file}; English locale is not implemented yet`);
}

if (!fs.existsSync("packages/database/prisma/migrations")) {
  warnings.push("Prisma migration history is not present. beta.3 supports only guarded initialization of a CLEAN first production database.");
}

for (const warning of warnings) console.warn(`[ELSYSTAR RELEASE] WARNING: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`[ELSYSTAR RELEASE] ERROR: ${error}`);
  process.exit(1);
}
console.log(`[ELSYSTAR RELEASE] Preflight passed for ${expectedVersion}.`);
