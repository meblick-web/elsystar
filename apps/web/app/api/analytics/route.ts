import { AnalyticsEventType, consumeRateLimit, isDatabaseConfigured, prisma } from "@elsystar/database";
import { NextResponse } from "next/server";
import { requestSecurityKey } from "../../../lib/request-security";

const eventMap = {
  page_view: AnalyticsEventType.PAGE_VIEW,
  product_view: AnalyticsEventType.PRODUCT_VIEW,
  document_download: AnalyticsEventType.DOCUMENT_DOWNLOAD,
  cta_click: AnalyticsEventType.CTA_CLICK,
  lead_submit: AnalyticsEventType.LEAD_SUBMIT,
  phone_click: AnalyticsEventType.PHONE_CLICK,
  email_click: AnalyticsEventType.EMAIL_CLICK,
} as const;

type EventName = keyof typeof eventMap;

function detectDevice(userAgent: string) {
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  if (/mobile|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
}

function cookieValue(cookie: string | null, name: string) {
  return cookie?.match(new RegExp(`(?:^|; )${name}=([^;]+)`))?.[1] ?? null;
}

function classifySource(referrer: string | null, utmSource: string | null) {
  if (utmSource) return utmSource.slice(0, 120);
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (/google\./i.test(host)) return "google";
    if (/yandex\./i.test(host)) return "yandex";
    if (/bing\./i.test(host)) return "bing";
    return host || "referral";
  } catch {
    return "referral";
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (!contentType.toLowerCase().includes("application/json")) return NextResponse.json({ error: "unsupported_media_type" }, { status: 415 });
  if (contentLength > 12_288) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });

  const rate = await consumeRateLimit({
    scope: "public_analytics",
    keyHash: requestSecurityKey(request),
    limit: 300,
    windowSeconds: 10 * 60,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { accepted: false, persisted: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = payload.name as EventName | undefined;
  const rawPath = typeof payload.path === "string" ? payload.path.slice(0, 500) : "/";
  const path = rawPath.startsWith("/") && !rawPath.startsWith("//") ? rawPath : "/";
  if (!name || !(name in eventMap)) return NextResponse.json({ error: "invalid_event" }, { status: 400 });

  const cookie = request.headers.get("cookie");
  const visitorCookie = cookieValue(cookie, "elsystar_vid");
  const sessionCookie = cookieValue(cookie, "elsystar_sid");
  const visitorId = visitorCookie ?? crypto.randomUUID();
  const sessionId = sessionCookie ?? crypto.randomUUID();
  const referrer = typeof payload.referrer === "string" ? payload.referrer.slice(0, 1000) : null;
  const userAgent = request.headers.get("user-agent") ?? "";
  const search = typeof payload.search === "string" ? payload.search.slice(0, 2000) : "";
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const utmSource = query.get("utm_source")?.slice(0, 120) ?? null;
  const utmMedium = query.get("utm_medium")?.slice(0, 120) ?? null;
  const utmCampaign = query.get("utm_campaign")?.slice(0, 160) ?? null;
  const source = classifySource(referrer, utmSource);
  const secureCookie = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") === true;

  const response = NextResponse.json({ accepted: true, persisted: false }, { status: 202 });
  if (!visitorCookie) response.cookies.set("elsystar_vid", visitorId, { httpOnly: true, sameSite: "lax", secure: secureCookie, maxAge: 60 * 60 * 24 * 365, path: "/" });
  response.cookies.set("elsystar_sid", sessionId, { httpOnly: true, sameSite: "lax", secure: secureCookie, maxAge: 60 * 30, path: "/" });

  if (!isDatabaseConfigured() || !prisma) return response;

  try {
    await prisma.analyticsEvent.create({
      data: {
        type: eventMap[name],
        visitorId,
        sessionId,
        path,
        productId: typeof payload.productId === "string" ? payload.productId.slice(0, 120) : null,
        documentId: typeof payload.documentId === "string" ? payload.documentId.slice(0, 120) : null,
        referrer,
        source,
        device: detectDevice(userAgent),
        metadata: {
          label: typeof payload.label === "string" ? payload.label.slice(0, 200) : null,
          href: typeof payload.href === "string" ? payload.href.slice(0, 1000) : null,
          utmSource,
          utmMedium,
          utmCampaign,
        },
      },
    });
    return NextResponse.json({ accepted: true, persisted: true });
  } catch (error) {
    console.error("analytics_event_write_failed", error);
    return response;
  }
}
