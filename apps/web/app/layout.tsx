import type { Metadata } from "next";
import { isDatabaseConfigured, prisma } from "@elsystar/database";
import { Suspense } from "react";
import { AnalyticsTracker } from "../components/analytics-tracker";
import { resolveSeoMetadata } from "../lib/seo";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, siteOrigin } from "../lib/site";
import { organizationJsonLd, websiteJsonLd } from "../lib/structured-data";
import "./styles.css";
import "./alpha3.css";
import "./alpha4.css";
import "./alpha6.css";
import "./alpha7.css";
import "./alpha8.css";
import "./alpha9.css";
import "./alpha9-states.css";
import "./alpha9_1.css";
import "./alpha9_1_components.css";
import "./alpha9_3.css";
import "./beta3.css";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await resolveSeoMetadata("/", {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  });

  return {
    metadataBase: new URL(siteOrigin()),
    applicationName: "ELSYSTAR",
    category: "technology",
    ...metadata,
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      yandex: process.env.YANDEX_SITE_VERIFICATION || undefined,
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let corporate: { companyName: string; emailPrimary: string | null; phonePrimary: string | null } | null = null;
  if (isDatabaseConfigured() && prisma) {
    try {
      corporate = await prisma.corporateContent.findUnique({
        where: { id: "corporate" },
        select: { companyName: true, emailPrimary: true, phonePrimary: true },
      });
    } catch (error) {
      console.error("structured_data_corporate_query_failed", error);
    }
  }

  const jsonLd = [
    organizationJsonLd({ name: corporate?.companyName, email: corporate?.emailPrimary, phone: corporate?.phonePrimary }),
    websiteJsonLd(),
  ];

  return (
    <html lang="ru">
      <body>
        <a className="skipLink" href="#main-content">Перейти к содержимому</a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <Suspense fallback={null}><AnalyticsTracker /></Suspense>
        <div id="main-content" className="appContent" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
