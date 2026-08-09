import type { Metadata } from "next";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/about", {
    title: "О компании ELSYSTAR — дорожные контроллеры и АСУДД",
    description: "ELSYSTAR: разработка и производство дорожных контроллеров, оборудования и программных решений для автоматизированного управления дорожным движением.",
  });
}

export default function AboutLayout({ children }: { children: React.ReactNode }) { return children; }
