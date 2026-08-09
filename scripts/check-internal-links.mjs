import fs from "node:fs";
import path from "node:path";

const roots = ["apps/web/app", "apps/web/components"];
const validTopLevel = new Set(["", "products", "solutions", "projects", "support", "about", "production", "contacts", "faq", "api", "sitemap.xml", "robots.txt"]);
const problems = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(tsx?|jsx?)$/.test(entry.name) ? [full] : [];
  });
}

for (const file of roots.flatMap(walk)) {
  const source = fs.readFileSync(file, "utf8");
  const regex = /href=["'](\/[A-Za-z0-9_./?=#%+\-]*)["']/g;
  for (const match of source.matchAll(regex)) {
    const href = match[1];
    if (href.startsWith("//")) {
      problems.push(`${file}: protocol-relative internal href is not allowed: ${href}`);
      continue;
    }
    const pathname = href.split(/[?#]/, 1)[0];
    const top = pathname.split("/").filter(Boolean)[0] || "";
    if (!validTopLevel.has(top)) problems.push(`${file}: unknown hard-coded internal route ${href}`);
  }
}

if (problems.length) {
  for (const item of problems) console.error(`[ELSYSTAR SEO] ${item}`);
  process.exit(1);
}
console.log("[ELSYSTAR SEO] Hard-coded internal link check passed.");
