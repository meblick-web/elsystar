import { AdminRole, isDatabaseConfigured, prisma } from "@elsystar/database";
import { requireRole } from "../../lib/auth";
import { deleteTranslation, saveTranslation } from "./actions";

const typeLabels: Record<string, string> = {
  HomepageContent: "Главная",
  CorporateContent: "Компания",
  CorporateCompetency: "Компетенции",
  ProductCategory: "Категории",
  Product: "Продукция",
  ProductSpecification: "Характеристики",
  ProductFeature: "Преимущества",
  ProductConfiguration: "Комплектации",
  Solution: "Решения",
  Project: "Проекты",
  FaqEntry: "FAQ",
  DocumentSeries: "Серии документов",
  Document: "Документы",
};

export default async function LocalizationPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  const query = await searchParams;
  const q = query.q?.trim() || "";
  const type = query.type?.trim() || "";
  const configured = isDatabaseConfigured() && Boolean(prisma);
  let rows: Array<{ id: string; locale: string; entityType: string; entityId: string; field: string; value: string; updatedAt: Date }> = [];
  if (configured && prisma) {
    rows = await prisma.contentTranslation.findMany({
      where: {
        locale: "en",
        ...(type ? { entityType: type } : {}),
        ...(q ? { OR: [{ entityId: { contains: q, mode: "insensitive" } }, { field: { contains: q, mode: "insensitive" } }, { value: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: [{ entityType: "asc" }, { entityId: "asc" }, { field: "asc" }],
      take: 500,
    });
  }
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.entityType, (counts.get(row.entityType) ?? 0) + 1);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6300";

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/content-qa">Контент QA</a><a className="active" href="/localization">RU / EN</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/corporate">Компания</a><a href="/documents">Документация</a><a href="/seo">SEO</a></nav></aside><main>
    <header><div><span>Контент</span><h1>RU / EN локализация</h1></div><div className="headerActions"><a className="adminButton" href={`${siteUrl}/en`} target="_blank" rel="noreferrer">Открыть EN ↗</a></div></header>
    <section className="localizationIntro"><div><strong>{rows.length}</strong><span>английских строк в текущей выборке</span></div><p>Русский контент остаётся основным. Английские строки хранятся отдельно и используются на адресах <code>/en/...</code>. Пустой перевод не заменяет русский оригинал.</p></section>
    <section className="localizationStats">{[...counts.entries()].map(([entityType,count])=><a key={entityType} href={`/localization?type=${encodeURIComponent(entityType)}`}><strong>{count}</strong><span>{typeLabels[entityType] ?? entityType}</span></a>)}</section>
    <section className="adminCard"><div className="title"><h2>Фильтр</h2><a href="/localization">Сбросить</a></div><form className="localizationFilter"><input name="q" defaultValue={q} placeholder="ID, поле или английский текст" /><select name="type" defaultValue={type}><option value="">Все типы</option>{Object.entries(typeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><button type="submit">Найти</button></form></section>
    <section className="translationList">{rows.map((row)=><article key={row.id}><div className="translationMeta"><strong>{typeLabels[row.entityType] ?? row.entityType}</strong><code>{row.entityId}</code><span>{row.field}</span></div><form action={saveTranslation}><input type="hidden" name="locale" value="en" /><input type="hidden" name="entityType" value={row.entityType} /><input type="hidden" name="entityId" value={row.entityId} /><input type="hidden" name="field" value={row.field} /><textarea name="value" defaultValue={row.value} rows={row.value.length > 180 ? 4 : 2} required /><div className="translationActions"><small>Обновлено {row.updatedAt.toLocaleString("ru-RU")}</small><button type="submit">Сохранить</button></div></form><form action={deleteTranslation}><input type="hidden" name="id" value={row.id} /><button className="dangerText" type="submit">Удалить перевод</button></form></article>)}</section>
    {!rows.length && <section className="adminCard"><h2>{configured ? "Переводы по фильтру не найдены" : "PostgreSQL не подключена"}</h2><p>{configured ? "После bootstrap beta.4 здесь появятся английские строки для текущего контента." : "Раздел станет доступен после подключения базы данных."}</p></section>}
    <section className="adminCard"><div className="title"><h2>Добавить перевод вручную</h2></div><form className="translationCreate" action={saveTranslation}><input type="hidden" name="locale" value="en" /><label>Тип сущности<select name="entityType" required>{Object.entries(typeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>ID / slug<input name="entityId" required placeholder="например uk-4-1m" /></label><label>Поле<input name="field" required placeholder="например shortDescription" /></label><label>English<textarea name="value" required rows={4} /></label><button type="submit">Добавить / обновить</button></form></section>
  </main></div>;
}
