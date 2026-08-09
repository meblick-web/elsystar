import type { Metadata } from "next";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/solutions", {
    title: "Решения ELSYSTAR — АСУДД и управление дорожным движением",
    description: "Решения ELSYSTAR для управления перекрёстками, централизованной диспетчеризации, АСУДТ «Мегаполис» и модернизации дорожной инфраструктуры.",
  });
}

export default function SolutionsLayout({ children }: { children: React.ReactNode }) { return children; }
