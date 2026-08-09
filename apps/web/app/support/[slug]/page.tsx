import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicDocumentSeriesBySlug } from "../../../lib/documents";

const labels: Record<string, string> = {
  MANUAL: "Руководство",
  CERTIFICATE: "Сертификат",
  SOFTWARE: "Программное обеспечение",
  FIRMWARE: "Прошивка",
  SCHEME: "Схема",
  PASSPORT: "Паспорт",
  OTHER: "Материал",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "Размер не указан";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const series = await getPublicDocumentSeriesBySlug(slug);
  if (!series) return { title: "Материал не найден — ELSYSTAR" };
  return { title: `${series.title} — ELSYSTAR`, description: series.description || `${labels[series.type] ?? "Материал"} ELSYSTAR` };
}

export default async function SupportSeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const series = await getPublicDocumentSeriesBySlug(slug);
  if (!series || !series.currentVersion) notFound();
  const current = series.currentVersion;
  const archive = series.versions.filter((version) => version.id !== current.id);
  const isSoftware = series.type === "SOFTWARE" || series.type === "FIRMWARE";

  return <main>
    <header className="header shell"><a className="logo" href="/">ELSY<span>STAR</span></a><nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/#contacts">Контакты</a></nav><div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="/#request">Получить КП</a></div></header>

    <section className="supportDetailHero shell"><div><a className="backLink" href="/support">← Центр документации</a><p className="eyebrow">{labels[series.type] ?? series.type} · {series.language.toUpperCase()}</p><h1>{series.title}</h1><p className="lead">{series.description || current.description || "Актуальный технический материал ELSYSTAR."}</p>{series.product && <a className="supportProductLink" href={`/products/${series.product.slug}`}>Для продукта: {series.product.model} →</a>}</div><aside className="currentRelease"><span>Актуальная версия</span><strong>{current.version ? `v${current.version}` : "Текущая"}</strong><small>{current.releaseDate ? `Релиз: ${current.releaseDate.toLocaleDateString("ru-RU")}` : "Дата релиза не указана"}</small><small>{current.fileName} · {formatSize(current.fileSize)}</small><a className="button" data-analytics="document_download" data-document-id={current.id} href={current.fileUrl} target="_blank" rel="noreferrer">Скачать</a></aside></section>

    {(current.description || current.releaseNotes || current.checksumSha256) && <section className="releaseDetail shell"><article><p className="eyebrow">О ТЕКУЩЕЙ ВЕРСИИ</p><h2>{isSoftware ? "Информация о релизе" : "Информация о документе"}</h2>{current.description && <p>{current.description}</p>}{current.releaseNotes && <div className="releaseNotesPublic"><h3>Что изменилось</h3><p>{current.releaseNotes}</p></div>}</article>{current.checksumSha256 && <aside><span>Контрольная сумма SHA-256</span><code>{current.checksumSha256}</code><p>Используйте контрольную сумму для проверки целостности скачанного файла.</p></aside>}</section>}

    <section className="versionArchive shell"><div className="sectionHead"><div><p className="eyebrow">ИСТОРИЯ ВЕРСИЙ</p><h2>Предыдущие релизы</h2></div><span>{archive.length}</span></div>{archive.length ? <div className="publicVersionList">{archive.map((version)=><article key={version.id}><div><strong>{version.version ? `v${version.version}` : "Версия без номера"}</strong><span>{version.releaseDate ? version.releaseDate.toLocaleDateString("ru-RU") : "Дата не указана"}</span></div><div><p>{version.releaseNotes || version.description || version.fileName}</p>{version.checksumSha256 && <code>SHA-256: {version.checksumSha256}</code>}</div><div><span>{formatSize(version.fileSize)}</span><a data-analytics="document_download" data-document-id={version.id} href={version.fileUrl} target="_blank" rel="noreferrer">Скачать →</a></div></article>)}</div> : <p className="emptyVersionArchive">Предыдущих публичных версий пока нет.</p>}</section>

    <section className="support shell"><div><p className="eyebrow">НУЖНА ПОМОЩЬ?</p><h2>Не нашли нужную версию или документ?</h2><p>Оставьте запрос — инженер поможет подобрать актуальный материал для вашего оборудования.</p></div><a className="button" href="/#request">Связаться с инженером</a></section>
    <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Продукция</b><a href="/products">Каталог</a><a href="/solutions">Решения</a></div><div><b>Поддержка</b><a href="/support">Документация</a></div><div><b>Компания</b><a href="/projects">Проекты</a><a href="/#contacts">Контакты</a></div></div></footer>
  </main>;
}
