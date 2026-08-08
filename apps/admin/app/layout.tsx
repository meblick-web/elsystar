import type { Metadata } from "next";
import "./styles.css";
import "./alpha3.css";
import "./alpha4.css";
import "./alpha5.css";
import "./alpha6.css";

export const metadata: Metadata = { title: "ELSYSTAR Admin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>;
}
