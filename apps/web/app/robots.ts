import type { MetadataRoute } from "next";
import { absoluteSiteUrl, searchIndexingEnabled, siteOrigin } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!searchIndexingEnabled()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: absoluteSiteUrl("/sitemap.xml"),
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: absoluteSiteUrl("/sitemap.xml"),
    host: siteOrigin(),
  };
}
