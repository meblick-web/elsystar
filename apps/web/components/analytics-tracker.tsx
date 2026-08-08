"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type EventName =
  | "page_view"
  | "product_view"
  | "document_download"
  | "cta_click"
  | "lead_submit"
  | "phone_click"
  | "email_click";

function emit(name: EventName, payload: Record<string, unknown> = {}) {
  const body = JSON.stringify({
    name,
    path: window.location.pathname,
    ...payload,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  });
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    emit("page_view");
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      const explicitEvent = anchor.dataset.analytics as EventName | undefined;

      if (explicitEvent) {
        emit(explicitEvent, {
          label: anchor.textContent?.trim() ?? undefined,
          href,
          productId: anchor.dataset.productId,
          documentId: anchor.dataset.documentId,
        });
        return;
      }

      if (href.startsWith("tel:")) emit("phone_click", { href });
      if (href.startsWith("mailto:")) emit("email_click", { href });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
