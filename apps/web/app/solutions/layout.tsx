import type { Metadata } from "next";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/solutions", { title: "Решения ELSYSTAR", description: "Системы и решения ELSYSTAR для управления дорожным движением." });
}

export default function SolutionsLayout({ children }: { children: React.ReactNode }) { return children; }
