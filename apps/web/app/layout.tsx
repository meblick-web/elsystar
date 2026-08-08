import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "ELSYSTAR — Интеллектуальные транспортные системы",
  description: "Дорожные контроллеры, программное обеспечение и АСУДТ ELSYSTAR.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
