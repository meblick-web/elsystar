import {
  AnalyticsEventType,
  isDatabaseConfigured,
  prisma,
} from "@elsystar/database";
import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = payload.name as EventName | undefined;
  const path = typeof payload.path === "string" ? payload.path.slice(0, 500) : "/";

  if (!name || !(name in eventMap)) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  const visitorCookie = request.headers.get("cookie")?.match(/(?:^|; )elsystar_vid=([^;]+)/)?.[1];
  const visitorId = visitorCookie ?? crypto.randomUUID();
  const referrer = request.headers.get("referer")?.slice(0, 1000) ?? null;
  const userAgent = request.headers.get("user-agent") ?? "";

  const response = NextResponse.json({ accepted: true, persisted: false }, { status: 202 });

  if (!visitorCookie) {
    response.cookies.set("elsystar_vid", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  if (!isDatabaseConfigured() || !prisma) return response;

  try {
    await prisma.analyticsEvent.create({
      data: {
        type: eventMap[name],
        visitorId,
        path,
        productId: typeof payload.productId === "string" ? payload.productId : null,
        documentId: typeof payload.documentId === "string" ? payload.documentId : null,
        referrer,
        source: referrer ? "referral" : "direct",
        device: detectDevice(userAgent),
        metadata: {
          label: typeof payload.label === "string" ? payload.label.slice(0, 200) : null,
          href: typeof payload.href === "string" ? payload.href.slice(0, 1000) : null,
        },
      },
    });

    return NextResponse.json({ accepted: true, persisted: true });
  } catch (error) {
    console.error("analytics_event_write_failed", error);
    return response;
  }
}
