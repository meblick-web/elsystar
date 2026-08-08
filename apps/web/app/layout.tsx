import type { Metadata } from "next";
import { AnalyticsTracker } from "../components/analytics-tracker";
import "./styles.css";
import "./alpha3.css";

export const metadata: Metadata = {
  title: "ELSYSTAR — Интеллектуальные транспортные системы",
  description: "Дорожные контроллеры, программное обеспечение и АСУДТ ELSYSTAR.",
};

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
