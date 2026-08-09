import type { Metadata } from "next";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/contacts", {
    title: "Контакты ELSYSTAR — консультация по дорожным контроллерам и АСУДД",
    description: "Контакты ELSYSTAR для консультаций по дорожным контроллерам, АСУДТ «Мегаполис», документации и коммерческим предложениям.",
  });
}

export default function ContactsLayout({ children }: { children: React.ReactNode }) { return children; }
