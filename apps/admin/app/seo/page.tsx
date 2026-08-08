import { AdminRole, prisma } from "@elsystar/database";
import { requireRole } from "../../lib/auth";
import { logout } from "../login/actions";
import { createRedirect, deleteRedirect, deleteSeoRoute, saveSeoRoute, toggleRedirect } from "./actions";

export default async function SeoPage({ searchParams }: { searchParams: Promise<{ saved?: string; redirectSaved?: string; error?: string }> }) {
  await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  const query = await searchParams;
  const [routes, redirects] = prisma ? await Promise.all([
    prisma.seoRoute.findMany({ orderBy: { path: "asc" } }).catch(() => []),
    prisma.redirectRule.findMany({ orderBy: { fromPath: "asc" } }).catch(() => []),
  ]) : [[], []];

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a className="active" href="/seo">SEO</a><a href="/users">Пользователи</a><a href="/audit">Журнал действий</a></nav></aside><main>
    <header><div><span>Поисковая оптимизация</span><h1>SEO и перенаправления</h1></div><div className="headerActions"><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {!prisma && <div className="adminNotice">Для SEO-настроек требуется PostgreSQL.</div>}
    {query.saved && <div className="adminSuccess">SEO-настройки сохранены.</div>}
    {query.redirectSaved && <div className="adminSuccess">Перенаправление сохранено.</div>}
    {query.error && <div className="adminError">Не удалось сохранить данные. Проверьте поля и подключение БД.</div>}

    <section className="contentCard formCard"><div className="title"><div><h2>SEO для маршрута</h2><p className="subtitle">Повторное сохранение того же пути обновит существующую запись.</p></div></div><form action={saveSeoRoute} className="adminForm"><div className="formGrid two"><label><span>Путь *</span><input name="path" placeholder="/products" required disabled={!prisma} /></label><label><span>Canonical</span><input name="canonical" placeholder="https://elsystar.com/products" disabled={!prisma} /></label></div><label><span>Title</span><input name="title" maxLength={160} disabled={!prisma} /></label><label><span>Description</span><textarea name="description" rows={3} maxLength={320} disabled={!prisma} /></label><div className="inlineChecks"><label className="checkLine"><input type="checkbox" name="indexable" defaultChecked disabled={!prisma} /><span>Index</span></label><label className="checkLine"><input type="checkbox" name="follow" defaultChecked disabled={!prisma} /><span>Follow</span></label></div><div className="formActions"><button className="primary" type="submit" disabled={!prisma}>Сохранить SEO</button></div></form></section>

    <section className="contentCard"><div className="title"><div><h2>Настроенные маршруты</h2><p className="subtitle">{routes.length} записей</p></div></div><div className="seoList">{routes.map((route) => { const remove = deleteSeoRoute.bind(null, route.id); return <article key={route.id}><div><strong>{route.path}</strong><span>{route.title || "Title не задан"}</span><small>{route.indexable ? "index" : "noindex"}, {route.follow ? "follow" : "nofollow"}{route.canonical ? ` · canonical: ${route.canonical}` : ""}</small></div><form action={remove}><button type="submit">Удалить</button></form></article>; })}</div>{!routes.length && <p className="empty">Индивидуальные SEO-настройки пока не созданы.</p>}</section>

    <section className="contentCard formCard" id="redirects"><div className="title"><div><h2>301 / 302 redirects</h2><p className="subtitle">Используются для старых URL при переносе сайта.</p></div></div><form action={createRedirect} className="adminForm"><div className="formGrid three"><label><span>Старый путь *</span><input name="fromPath" placeholder="/old-page.html" required disabled={!prisma} /></label><label><span>Куда перенаправить *</span><input name="toPath" placeholder="/products" required disabled={!prisma} /></label><label><span>Код</span><select name="status" defaultValue="301" disabled={!prisma}><option value="301">301 permanent</option><option value="302">302 temporary</option></select></label></div><div className="formActions"><button className="primary" type="submit" disabled={!prisma}>Добавить redirect</button></div></form>
      <div className="redirectList">{redirects.map((rule) => { const toggle = toggleRedirect.bind(null, rule.id, !rule.enabled); const remove = deleteRedirect.bind(null, rule.id); return <article key={rule.id}><div><strong>{rule.fromPath}</strong><span>→ {rule.toPath}</span><small>{rule.status} · {rule.enabled ? "активен" : "выключен"}</small></div><div className="rowActions"><form action={toggle}><button type="submit">{rule.enabled ? "Выключить" : "Включить"}</button></form><form action={remove}><button type="submit">Удалить</button></form></div></article>; })}</div>
    </section>
    <footer>v0.1.0-alpha.5 · SEO Operations</footer>
  </main></div>;
}
