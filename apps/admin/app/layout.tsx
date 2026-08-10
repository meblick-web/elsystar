import type { Metadata } from "next";
import "./styles.css";
import "./alpha3.css";
import "./alpha4.css";
import "./alpha5.css";
import "./alpha6.css";
import "./alpha7.css";
import "./alpha8.css";
import "./alpha9.css";
import "./alpha9-states.css";
import "./alpha9_3.css";
import "./beta3.css";
import "./beta4.css";
import "./beta5.css";

export const metadata: Metadata = {
  title: "ELSYSTAR Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body><a className="skipLink" href="#admin-content">Перейти к содержимому</a><div id="admin-content" className="appContent" tabIndex={-1}>{children}</div></body></html>;
}
