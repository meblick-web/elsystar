import type { Metadata } from "next";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/production", {
    title: "Производство ELSYSTAR — дорожные контроллеры и оборудование АСУДД",
    description: "Собственное производство ELSYSTAR: дорожные контроллеры, модули сопряжения и оборудование для систем управления дорожным движением.",
  });
}

export default function ProductionLayout({ children }: { children: React.ReactNode }) { return children; }
