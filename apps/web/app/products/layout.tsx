import type { Metadata } from "next";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/products", { title: "Продукция ELSYSTAR", description: "Дорожные контроллеры и оборудование ELSYSTAR." });
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) { return children; }
