const production = process.env.NODE_ENV === "production";
const issues = [];
const warnings = [];

function value(name) {
  return (process.env[name] ?? "").trim();
}
function requireLongSecret(name) {
  const current = value(name);
  if (current.length < 32) (production ? issues : warnings).push(`${name} must contain at least 32 characters`);
  if (/change|replace|example|preview/i.test(current)) (production ? issues : warnings).push(`${name} looks like a placeholder`);
}
function requireHttps(name) {
  const current = value(name);
  if (!current) (production ? issues : warnings).push(`${name} is not configured`);
  else if (production && !current.startsWith("https://")) issues.push(`${name} must use HTTPS in production`);
}

if (!value("DATABASE_URL")) (production ? issues : warnings).push("DATABASE_URL is not configured");
requireLongSecret("ADMIN_SESSION_SECRET");
requireLongSecret("SECURITY_HASH_SECRET");
requireHttps("NEXT_PUBLIC_SITE_URL");
requireHttps("NEXT_PUBLIC_ADMIN_URL");

const bootstrapPassword = value("ADMIN_PASSWORD");
if (production && bootstrapPassword && bootstrapPassword.length < 14) issues.push("ADMIN_PASSWORD bootstrap credential is too short for production");
if (production && /change|preview|password|12345/i.test(bootstrapPassword)) issues.push("ADMIN_PASSWORD looks like a default or placeholder credential");

for (const warning of warnings) console.warn(`[ELSYSTAR] security warning: ${warning}`);
if (issues.length) {
  for (const issue of issues) console.error(`[ELSYSTAR] security error: ${issue}`);
  process.exit(1);
}
console.log(`[ELSYSTAR] Security preflight: ${production ? "production requirements satisfied" : "development mode checked"}.`);
