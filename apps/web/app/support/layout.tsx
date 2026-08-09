import type { Metadata } from "next";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/support", {
    title: "Документация и поддержка ELSYSTAR",
    description: "Руководства, сертификаты, программное обеспечение, прошивки и технические материалы ELSYSTAR с актуальными версиями.",
  });
}

export default function SupportLayout({ children }: { children: React.ReactNode }) { return children; }
