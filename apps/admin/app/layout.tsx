import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "ELSYSTAR Admin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>;
}
