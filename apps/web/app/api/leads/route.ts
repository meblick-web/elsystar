import { AnalyticsEventType, consumeRateLimit, isDatabaseConfigured, prisma } from "@elsystar/database";
import { NextResponse } from "next/server";
import { requestSecurityKey } from "../../../lib/request-security";

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeSourcePath(value: unknown) {
  const path = text(value, 500);
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

function validEmail(value: string) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "unsupported_media_type" }, { status: 415 });
  }
  if (contentLength > 16_384) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });

  const rate = await consumeRateLimit({
    scope: "public_lead",
    keyHash: requestSecurityKey(request),
    limit: 5,
    windowSeconds: 10 * 60,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds), "Cache-Control": "no-store" } },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot for unsophisticated form bots. Real users never see or fill this field.
  if (text(payload.website, 200)) return NextResponse.json({ accepted: true }, { status: 202 });

  const name = text(payload.name, 120);
  const company = text(payload.company, 160);
  const email = text(payload.email, 200).toLowerCase();
  const phone = text(payload.phone, 80);
  const message = text(payload.message, 3000);
  const productId = text(payload.productId, 80);
  const sourcePath = safeSourcePath(payload.sourcePath);

  if (name.length < 2 || (!email && !phone) || !validEmail(email)) {
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
        secure: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") === true,
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
