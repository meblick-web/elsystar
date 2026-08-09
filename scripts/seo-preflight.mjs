import fs from "node:fs";

const enabled = process.env.SEO_INDEXING_ENABLED === "true";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
const errors = [];
const warnings = [];

for (const path of [
  "apps/web/app/robots.ts",
  "apps/web/app/sitemap.ts",
  "apps/web/app/opengraph-image.tsx",
  "packages/database/scripts/bootstrap-seo-beta2.mjs",
]) {
  if (!fs.existsSync(path)) errors.push(`missing required SEO file: ${path}`);
}

if (enabled) {
  try {
    const url = new URL(siteUrl);
    if (url.protocol !== "https:") errors.push("NEXT_PUBLIC_SITE_URL must use HTTPS when SEO indexing is enabled");
    if (url.hostname === "localhost" || url.hostname.endsWith(".app.github.dev")) errors.push("SEO indexing cannot be enabled for localhost/Codespaces preview");
  } catch {
    errors.push("NEXT_PUBLIC_SITE_URL must be a valid absolute production URL when SEO indexing is enabled");
  }

  if (!process.env.GOOGLE_SITE_VERIFICATION) warnings.push("GOOGLE_SITE_VERIFICATION not set; DNS verification may be used instead");
  if (!process.env.YANDEX_SITE_VERIFICATION) warnings.push("YANDEX_SITE_VERIFICATION not set; DNS/file verification may be used instead");
} else {
  console.log("[ELSYSTAR SEO] Search indexing is disabled. This is expected for CI and preview environments.");
}

for (const warning of warnings) console.warn(`[ELSYSTAR SEO] WARNING: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`[ELSYSTAR SEO] ERROR: ${error}`);
  process.exit(1);
}
console.log("[ELSYSTAR SEO] Preflight passed.");
