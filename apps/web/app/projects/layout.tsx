import type { Metadata } from "next";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/projects", {
    title: "Проекты ELSYSTAR — решения для транспортной инфраструктуры",
    description: "Проекты и сценарии применения дорожных контроллеров, АСУДД и программных решений ELSYSTAR.",
  });
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) { return children; }
