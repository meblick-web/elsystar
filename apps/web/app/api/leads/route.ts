import { AnalyticsEventType, isDatabaseConfigured, prisma } from "@elsystar/database";
import { NextResponse } from "next/server";

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = text(payload.name, 120);
  const company = text(payload.company, 160);
  const email = text(payload.email, 200);
  const phone = text(payload.phone, 80);
  const message = text(payload.message, 3000);
  const productId = text(payload.productId, 80);
  const sourcePath = text(payload.sourcePath, 500) || "/";

  if (name.length < 2 || (!email && !phone)) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }

  const referrer = request.headers.get("referer")?.slice(0, 1000) ?? null;
  const visitorCookie = request.headers.get("cookie")?.match(/(?:^|; )elsystar_vid=([^;]+)/)?.[1];
  const visitorId = visitorCookie ?? crypto.randomUUID();

  try {
    const lead = await prisma.$transaction(async (tx) => {
      let safeProductId: string | null = null;
      if (productId) {
        const product = await tx.product.findUnique({ where: { id: productId }, select: { id: true } });
        safeProductId = product?.id ?? null;
      }

      const created = await tx.lead.create({
        data: {
          name,
          company: company || null,
          email: email || null,
          phone: phone || null,
          message: message || null,
          productId: safeProductId,
          sourcePath,
          referrer,
          source: referrer ? "referral" : "direct",
          utmSource: text(payload.utmSource, 200) || null,
          utmMedium: text(payload.utmMedium, 200) || null,
          utmCampaign: text(payload.utmCampaign, 200) || null,
        },
      });

      await tx.analyticsEvent.create({
        data: {
          type: AnalyticsEventType.LEAD_SUBMIT,
          visitorId,
          path: sourcePath,
          productId: safeProductId,
          referrer,
          source: referrer ? "referral" : "direct",
          metadata: { leadId: created.id },
        },
      });

      return created;
    });

    const response = NextResponse.json({ accepted: true, id: lead.id }, { status: 201 });
    if (!visitorCookie) {
      response.cookies.set("elsystar_vid", visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return response;
  } catch (error) {
    console.error("lead_write_failed", error);
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }
}
