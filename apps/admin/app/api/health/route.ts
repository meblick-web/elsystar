import { isDatabaseConfigured, prisma } from "@elsystar/database";
import { NextResponse } from "next/server";

export async function GET() {
  let database: "ready" | "unconfigured" | "error" = isDatabaseConfigured() && prisma ? "ready" : "unconfigured";
  if (database === "ready" && prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error("admin_health_db_failed", error);
      database = "error";
    }
  }

  const sessionSecret = process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
  const configuration = {
    database: database !== "unconfigured",
    adminSessionSecret: sessionSecret.length >= 32,
    securityHashSecret: Boolean(process.env.SECURITY_HASH_SECRET?.trim()),
  };
  const healthy = database !== "error" && configuration.adminSessionSecret;

  return NextResponse.json(
    { service: "elsystar-admin", status: healthy ? "ok" : "degraded", database, configuration, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
