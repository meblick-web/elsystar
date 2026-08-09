import type { Metadata } from "next";
import { AnalyticsTracker } from "../components/analytics-tracker";
import { resolveSeoMetadata } from "../lib/seo";
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

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/", {
    title: "ELSYSTAR — Интеллектуальные транспортные системы",
    description: "Дорожные контроллеры, программное обеспечение и АСУДТ ELSYSTAR.",
  });
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
