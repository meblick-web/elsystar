import type { Metadata } from "next";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/products", {
    title: "Продукция ELSYSTAR — дорожные контроллеры и оборудование АСУДД",
    description: "Каталог дорожных контроллеров и оборудования ELSYSTAR для светофорных объектов и автоматизированных систем управления дорожным движением.",
  });
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) { return children; }
