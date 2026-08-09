import type { Metadata } from "next";
import { ContentStatus, isDatabaseConfigured, prisma } from "@elsystar/database";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await resolveSeoMetadata("/projects", {
    title: "Проекты ELSYSTAR — решения для транспортной инфраструктуры",
    description: "Проекты и сценарии применения дорожных контроллеров, АСУДД и программных решений ELSYSTAR.",
  });

  if (isDatabaseConfigured() && prisma) {
    try {
      const realProjects = await prisma.project.count({ where: { status: ContentStatus.PUBLISHED, isDemo: false } });
      if (realProjects === 0) return { ...metadata, robots: { index: false, follow: true } };
    } catch (error) {
      console.error("projects_seo_count_failed", error);
      return { ...metadata, robots: { index: false, follow: true } };
    }
  }

  return metadata;
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) { return children; }
