import type { Metadata } from "next";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/faq", {
    title: "FAQ ELSYSTAR — оборудование, ПО и техническая поддержка",
    description: "Ответы на вопросы о дорожных контроллерах ELSYSTAR, АСУДТ «Мегаполис», документации, программном обеспечении и получении коммерческого предложения.",
  });
}

export default function FaqLayout({ children }: { children: React.ReactNode }) { return children; }
