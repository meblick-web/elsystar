import { AdminRole, DocumentType, prisma } from "@elsystar/database";
import { requireRole } from "../../lib/auth";
import { logout } from "../login/actions";
import { createSeries, deleteDocument, toggleDocument } from "./actions";

const typeLabels: Record<DocumentType, string> = {
  MANUAL: "Руководство",
  CERTIFICATE: "Сертификат",
  SOFTWARE: "ПО",
  FIRMWARE: "Прошивка",
  SCHEME: "Схема",
  PASSPORT: "Паспорт",
  OTHER: "Другое",
};

function readType(value?: string) {
  return value && Object.values(DocumentType).includes(value as DocumentType) ? value as DocumentType : undefined;
}

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; product?: string; language?: string; error?: string; deleted?: string }> }) {
  await requireRole(AdminRole.ADMIN, AdminRole.EDITOR, AdminRole.SUPPORT);
  const query = await searchParams;
  const q = query.q?.trim() || "";
  const type = readType(query.type);
  const productId = query.product?.trim() || "";
  const language = query.language?.trim().toLowerCase() || "";

  const where: any = {};
  if (q) where.OR = [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }];
  if (type) where.type = type;
  if (productId) where.productId = productId;
  if (language) where.language = language;

  const [series, products, allLanguages, legacyDocuments] = prisma ? await Promise.all([
    prisma.documentSeries.findMany({ where, orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }], include: { product: { select: { model: true } }, versions: { orderBy: [{ isCurrent: "desc" }, { releaseDate: "desc" }, { createdAt: "desc" }], take: 1 }, _count: { select: { versions: true } } } }).catch(() => []),
    prisma.product.findMany({ orderBy: { model: "asc" }, select: { id: true, model: true } }).catch(() => []),
    prisma.documentSeries.findMany({ distinct: ["language"], select: { language: true }, orderBy: { language: "asc" } }).catch(() => []),
    prisma.document.findMany({ where: { seriesId: null }, orderBy: { createdAt: "desc" }, include: { product: { select: { model: true } } }, take: 100 }).catch(() => []),
  ]) : [[], [], [], []];

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a className="active" href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="/seo">SEO</a><a href="/users">Пользователи</a><a href="/audit">Журнал действий</a></nav></aside><main>
    <header><div><span>Файлы, версии и релизы</span><h1>Documentation & Software Center</h1></div><div className="headerActions"><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {!prisma && <div className="adminNotice">Для управления документацией требуется PostgreSQL.</div>}
    {query.deleted && <div className="adminSuccess">Серия удалена.</div>}
    {query.error === "required" && <div className="adminError">Укажите название серии.</div>}

    <section className="contentCard"><form className="documentFilters"><input name="q" defaultValue={q} placeholder="Поиск по названию или slug" /><select name="type" defaultValue={type ?? ""}><option value="">Все типы</option>{Object.values(DocumentType).map((value)=><option key={value} value={value}>{typeLabels[value]}</option>)}</select><select name="product" defaultValue={productId}><option value="">Все продукты</option>{products.map((product)=><option key={product.id} value={product.id}>{product.model}</option>)}</select><select name="language" defaultValue={language}><option value="">Все языки</option>{allLanguages.map((item)=><option key={item.language} value={item.language}>{item.language.toUpperCase()}</option>)}</select><button type="submit">Фильтр</button><a className="adminButton" href="/documents">Сбросить</a></form></section>

    <section className="contentCard"><div className="title"><div><h2>Серии материалов</h2><p className="subtitle">Одна серия — один материал, внутри неё хранится текущая версия и архив.</p></div><a href="#new-series">+ Новая серия</a></div>
      <div className="documentSeriesTable"><div className="documentSeriesRow head"><span>Материал</span><span>Тип</span><span>Продукт / язык</span><span>Текущая версия</span><span>Версий</span><span></span></div>{series.map((item)=>{const current=item.versions[0];return <div className="documentSeriesRow" key={item.id}><div><strong>{item.title}</strong><small>/{item.slug}</small></div><span>{typeLabels[item.type]}</span><div><strong>{item.product?.model ?? "Без продукта"}</strong><small>{item.language.toUpperCase()}</small></div><div>{current ? <><strong>{current.version ? `v${current.version}` : "Без номера"}</strong><small>{current.isCurrent ? "Текущая" : "Последняя добавленная"}{current.releaseDate ? ` · ${current.releaseDate.toLocaleDateString("ru-RU")}` : ""}</small></> : <span>Нет версий</span>}</div><strong>{item._count.versions}</strong><a href={`/documents/${item.id}`}>Редактировать →</a></div>;})}</div>
      {!series.length && <p className="empty">Серий по выбранным фильтрам нет.</p>}
    </section>

    <section className="contentCard formCard" id="new-series"><div className="title"><div><h2>Новая серия</h2><p className="subtitle">Например: «Руководство УК-4.1М» или «ПО АСУДТ Мегаполис».</p></div></div><form action={createSeries} className="adminForm"><div className="formGrid three"><label><span>Название *</span><input name="title" required disabled={!prisma} /></label><label><span>Slug</span><input name="slug" placeholder="uk-4-1m-manual" disabled={!prisma} /></label><label><span>Тип</span><select name="type" defaultValue={DocumentType.MANUAL} disabled={!prisma}>{Object.values(DocumentType).map((value)=><option key={value} value={value}>{typeLabels[value]}</option>)}</select></label><label><span>Продукт</span><select name="productId" defaultValue="" disabled={!prisma}><option value="">Без привязки</option>{products.map((product)=><option key={product.id} value={product.id}>{product.model}</option>)}</select></label><label><span>Язык</span><input name="language" defaultValue="ru" disabled={!prisma} /></label><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue="0" disabled={!prisma} /></label></div><label><span>Описание</span><textarea name="description" rows={3} disabled={!prisma} /></label><div className="formActions"><button className="primary" type="submit" disabled={!prisma}>Создать серию</button></div></form></section>

    {legacyDocuments.length > 0 && <section className="contentCard"><div className="title"><div><h2>Старые одиночные материалы</h2><p className="subtitle">Записи из предыдущих версий CMS. Они продолжают работать, но новые материалы создавайте сериями.</p></div><span>{legacyDocuments.length}</span></div><div className="adminTable documentsTable"><div className="adminTableRow adminTableHead"><span>Документ</span><span>Тип</span><span>Продукт</span><span>Публикация</span><span>Действия</span></div>{legacyDocuments.map((document)=><div className="adminTableRow" key={document.id}><div><strong>{document.title}</strong><small>{document.fileName}{document.version ? ` · v${document.version}` : ""}</small></div><span>{typeLabels[document.type]}</span><span>{document.product?.model || "—"}</span><div><strong>{document.publishedAt ? "Опубликован" : "Черновик"}</strong><small>{document.isPublic ? "Публичный" : "Скрытый"}</small></div><div className="rowActions"><a href={document.fileUrl} target="_blank" rel="noreferrer">Открыть ↗</a><form action={toggleDocument.bind(null, document.id)}><button type="submit">{document.publishedAt ? "Снять" : "Опубликовать"}</button></form><form action={deleteDocument.bind(null, document.id)}><button className="dangerButton" type="submit">Удалить</button></form></div></div>)}</div></section>}
    <footer>v0.1.0-alpha.7 · Documentation & Software Center</footer>
  </main></div>;
}
