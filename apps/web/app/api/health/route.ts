import { isDatabaseConfigured, prisma } from "@elsystar/database";
import { NextResponse } from "next/server";

export async function GET() {
  let database: "ready" | "unconfigured" | "error" = isDatabaseConfigured() && prisma ? "ready" : "unconfigured";
  if (database === "ready" && prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error("public_health_db_failed", error);
      database = "error";
    }
  }

  const healthy = database !== "error";
  return NextResponse.json(
    { service: "elsystar-web", status: healthy ? "ok" : "degraded", database, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
