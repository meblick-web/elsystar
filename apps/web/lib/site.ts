export function siteOrigin() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (configured) {
    try {
      const url = new URL(configured);
      return url.origin.replace(/\/$/, "");
    } catch {
      // Fall through to the production canonical domain.
    }
  }
  return process.env.NODE_ENV === "production" ? "https://elsystar.com" : "http://localhost:6300";
}

export function absoluteSiteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, `${siteOrigin()}/`).toString();
}

export function searchIndexingEnabled() {
  if (process.env.SEO_INDEXING_ENABLED !== "true") return false;
  try {
    const host = new URL(siteOrigin()).hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1" && !host.endsWith(".app.github.dev");
  } catch {
    return false;
  }
}

export const SITE_NAME = "ELSYSTAR";
export const DEFAULT_TITLE = "ELSYSTAR — Интеллектуальные транспортные системы и АСУДД";
export const DEFAULT_DESCRIPTION = "Дорожные контроллеры, АСУДТ «Мегаполис», программное обеспечение и инженерные решения ELSYSTAR для управления дорожным движением.";
