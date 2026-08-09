import type { Metadata } from "next";
import "./styles.css";
import "./alpha3.css";
import "./alpha4.css";
import "./alpha5.css";
import "./alpha6.css";
import "./alpha7.css";
import "./alpha8.css";
import "./alpha9.css";

export const metadata: Metadata = { title: "ELSYSTAR Admin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>;
}
