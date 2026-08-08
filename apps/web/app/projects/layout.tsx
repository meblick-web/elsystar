import type { Metadata } from "next";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/projects", { title: "Проекты ELSYSTAR", description: "Проекты и внедрения ELSYSTAR." });
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) { return children; }
