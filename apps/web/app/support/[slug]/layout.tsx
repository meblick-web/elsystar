import type { Metadata } from "next";
import { getPublicDocumentSeriesBySlug } from "../../../lib/documents";
import { buildEntityMetadata } from "../../../lib/seo";

const typeLabels: Record<string, string> = {
  MANUAL: "Руководство",
  CERTIFICATE: "Сертификат",
  SOFTWARE: "Программное обеспечение",
  FIRMWARE: "Прошивка",
  SCHEME: "Схема",
  PASSPORT: "Паспорт",
  OTHER: "Материал",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const series = await getPublicDocumentSeriesBySlug(slug);
  if (!series) return { robots: { index: false, follow: false } };
  return buildEntityMetadata({
    path: `/support/${series.slug}`,
    title: `${series.title} — ELSYSTAR`,
    description: series.description || `${typeLabels[series.type] ?? "Материал"} ELSYSTAR`,
  });
}

export default function SupportSeriesLayout({ children }: { children: React.ReactNode }) { return children; }
