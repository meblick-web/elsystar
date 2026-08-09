import { AdminRole, DocumentType, prisma } from "@elsystar/database";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth";
import { logout } from "../../login/actions";
import { createVersion, deleteSeries, setCurrentVersion, toggleDocument, updateSeries } from "../actions";
import { deleteSeriesVersion } from "../version-actions";

const typeLabels: Record<DocumentType, string> = {
  MANUAL: "Руководство",
  CERTIFICATE: "Сертификат",
  SOFTWARE: "ПО",
  FIRMWARE: "Прошивка",
  SCHEME: "Схема",
  PASSPORT: "Паспорт",
  OTHER: "Другое",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default async function DocumentSeriesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; versionCreated?: string; error?: string }> }) {
  await requireRole(AdminRole.ADMIN, AdminRole.EDITOR, AdminRole.SUPPORT);
  const { id } = await params;
  const query = await searchParams;
  if (!prisma) redirect("/documents?error=db");

  const [series, products] = await Promise.all([
    prisma.documentSeries.findUnique({ where: { id }, include: { product: { select: { model: true } }, versions: { orderBy: [{ isCurrent: "desc" }, { releaseDate: "desc" }, { createdAt: "desc" }] } } }),
    prisma.product.findMany({ orderBy: { model: "asc" }, select: { id: true, model: true } }),
  ]);
  if (!series) notFound();

  const isSoftware = series.type === DocumentType.SOFTWARE || series.type === DocumentType.FIRMWARE;
  const publicSite = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6300";

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a className="active" href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="/seo">SEO</a><a href="/users">Пользователи</a><a href="/audit">Журнал действий</a></nav></aside><main>
    <header><div><span>{typeLabels[series.type]} · {series.language.toUpperCase()}</span><h1>{series.title}</h1></div><div className="headerActions"><a className="adminButton" href={`${publicSite}/support/${series.slug}`} target="_blank" rel="noreferrer">Публичная страница ↗</a><a className="adminButton" href="/documents">← Документация</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {query.created && <div className="adminSuccess">Серия создана. Добавьте первую версию.</div>}
    {query.versionCreated && <div className="adminSuccess">Новая версия добавлена.</div>}
    {query.error === "required" && <div className="adminError">Заполните обязательные поля серии.</div>}
    {query.error === "version-required" && <div className="adminError">Для версии нужны номер, URL и имя файла.</div>}
    {query.error === "checksum" && <div className="adminError">SHA-256 должен содержать ровно 64 шестнадцатеричных символа.</div>}
    {query.error === "has-versions" && <div className="adminError">Сначала удалите все версии, затем можно удалить серию.</div>}

    <section className="contentCard formCard"><div className="title"><div><h2>Параметры серии</h2><p className="subtitle">Эти данные общие для всех версий.</p></div><span>{series.versions.length} версий</span></div><form action={updateSeries.bind(null, series.id)} className="adminForm"><div className="formGrid three"><label><span>Название *</span><input name="title" defaultValue={series.title} required /></label><label><span>Slug *</span><input name="slug" defaultValue={series.slug} required /></label><label><span>Тип</span><select name="type" defaultValue={series.type}>{Object.values(DocumentType).map((value)=><option key={value} value={value}>{typeLabels[value]}</option>)}</select></label><label><span>Продукт</span><select name="productId" defaultValue={series.productId ?? ""}><option value="">Без привязки</option>{products.map((product)=><option key={product.id} value={product.id}>{product.model}</option>)}</select></label><label><span>Язык</span><input name="language" defaultValue={series.language} /></label><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue={series.sortOrder} /></label></div><label><span>Описание</span><textarea name="description" rows={4} defaultValue={series.description ?? ""} /></label><div className="formActions"><button className="primary" type="submit">Сохранить серию</button></div></form></section>

    <section className="contentCard formCard" id="new-version"><div className="title"><div><h2>Добавить версию</h2><p className="subtitle">Новая версия не удаляет предыдущие — они остаются в архиве.</p></div></div><form action={createVersion.bind(null, series.id)} className="adminForm"><div className="formGrid three"><label><span>Версия *</span><input name="version" placeholder={isSoftware ? "2.4.1" : "3.0"} required /></label><label><span>Дата релиза</span><input name="releaseDate" type="date" /></label><label><span>Имя файла *</span><input name="fileName" placeholder="uk-4-1m-manual-v3.pdf" required /></label><label className="span2"><span>URL файла *</span><input name="fileUrl" type="url" placeholder="https://..." required /></label><label><span>MIME</span><input name="mimeType" placeholder={isSoftware ? "application/zip" : "application/pdf"} /></label><label><span>Размер, байт</span><input name="fileSize" type="number" min="0" /></label><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue="0" /></label></div><label><span>Краткое описание версии</span><textarea name="description" rows={2} /></label>{isSoftware && <><label><span>Что изменилось</span><textarea name="releaseNotes" rows={5} placeholder="Исправления, новые возможности, совместимость…" /></label><label><span>SHA-256</span><input name="checksumSha256" maxLength={64} placeholder="64 hex символа" /></label></>}<div className="inlineChecks"><label className="checkLine"><input type="checkbox" name="isPublic" defaultChecked /><span>Публичная</span></label><label className="checkLine"><input type="checkbox" name="published" defaultChecked /><span>Опубликовать сразу</span></label><label className="checkLine"><input type="checkbox" name="isCurrent" defaultChecked /><span>Сделать текущей</span></label></div><div className="formActions"><button className="primary" type="submit">Добавить версию</button></div></form></section>

    <section className="contentCard"><div className="title"><div><h2>История версий</h2><p className="subtitle">Текущая версия показывается первой, остальные доступны в архиве.</p></div><span>{series.versions.length}</span></div><div className="versionList">{series.versions.map((version)=><article className={version.isCurrent ? "current" : ""} key={version.id}><div className="versionMain"><div><span className="versionBadge">v{version.version ?? "—"}</span>{version.isCurrent && <span className="currentBadge">Текущая</span>}{version.publishedAt ? <span className="publishedBadge">Опубликована</span> : <span className="draftBadge">Черновик</span>}</div><strong>{version.fileName}</strong><small>{version.releaseDate ? version.releaseDate.toLocaleDateString("ru-RU") : "Дата не указана"} · {formatSize(version.fileSize)} · {version.isPublic ? "публичная" : "скрытая"}</small>{version.description && <p>{version.description}</p>}{version.releaseNotes && <div className="releaseNotes"><b>Изменения</b><p>{version.releaseNotes}</p></div>}{version.checksumSha256 && <code>SHA-256: {version.checksumSha256}</code>}</div><div className="versionActions"><a href={version.fileUrl} target="_blank" rel="noreferrer">Открыть ↗</a>{!version.isCurrent && <form action={setCurrentVersion.bind(null, version.id, series.id)}><button type="submit">Сделать текущей</button></form>}<form action={toggleDocument.bind(null, version.id)}><button type="submit">{version.publishedAt ? "Снять" : "Опубликовать"}</button></form><form action={deleteSeriesVersion.bind(null, version.id, series.id)}><button className="dangerButton" type="submit">Удалить</button></form></div></article>)}</div>{!series.versions.length && <p className="empty">Версий пока нет.</p>}</section>

    <section className="dangerZone"><div><strong>Удалить серию</strong><p>Удаление доступно только после удаления всех версий.</p></div><form action={deleteSeries.bind(null, series.id)}><button type="submit">Удалить серию</button></form></section>
    <footer>v0.1.0-alpha.7 · Documentation Series Editor</footer>
  </main></div>;
}
