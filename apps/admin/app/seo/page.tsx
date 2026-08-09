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

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:6300").replace(/\/$/, "");
  const indexingEnabled = process.env.SEO_INDEXING_ENABLED === "true";
  const isPreview = siteUrl.includes("app.github.dev") || siteUrl.includes("localhost");
  const activeRedirects = redirects.filter((item) => item.enabled).length;
  const indexedRoutes = routes.filter((item) => item.indexable).length;

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a className="active" href="/seo">SEO</a><a href="/users">Пользователи</a><a href="/audit">Журнал действий</a></nav></aside><main>
    <header><div><span>Поисковая оптимизация</span><h1>SEO, индексация и миграция</h1></div><div className="headerActions"><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {!prisma && <div className="adminNotice">Для SEO-настроек требуется PostgreSQL.</div>}
    {query.saved && <div className="adminSuccess">SEO-настройки сохранены.</div>}
    {query.redirectSaved && <div className="adminSuccess">Перенаправление сохранено.</div>}
    {query.error === "canonical" && <div className="adminError">Canonical должен быть корректным абсолютным HTTP/HTTPS URL.</div>}
    {query.error === "redirect" && <div className="adminError">Redirect должен вести на внутренний путь вида /products и не может вести сам в себя.</div>}
    {query.error && !["canonical", "redirect"].includes(query.error) && <div className="adminError">Не удалось сохранить данные. Проверьте поля и подключение БД.</div>}

    <section className="contentCard"><div className="title"><div><h2>Готовность к поисковым системам</h2><p className="subtitle">В preview индексация намеренно закрыта. На production она включается только переменной SEO_INDEXING_ENABLED=true.</p></div></div>
      <div className="analyticsMetricGrid">
        <article><span>Canonical host</span><strong>{siteUrl.replace(/^https?:\/\//, "")}</strong><small>{isPreview ? "Preview — не индексировать" : "Production domain"}</small></article>
        <article><span>Индексация</span><strong>{indexingEnabled && !isPreview ? "ON" : "OFF"}</strong><small>{indexingEnabled && !isPreview ? "robots разрешает crawl" : "robots закрывает весь preview"}</small></article>
        <article><span>SEO routes</span><strong>{indexedRoutes}</strong><small>{routes.length} настроено всего</small></article>
        <article><span>301/302</span><strong>{activeRedirects}</strong><small>{redirects.length} правил всего</small></article>
        <article><span>Google verify</span><strong>{process.env.GOOGLE_SITE_VERIFICATION ? "READY" : "—"}</strong><small>Можно использовать DNS verification</small></article>
        <article><span>Yandex verify</span><strong>{process.env.YANDEX_SITE_VERIFICATION ? "READY" : "—"}</strong><small>Можно использовать DNS verification</small></article>
      </div>
      <div className="rowActions"><a className="adminButton" href={`${siteUrl}/robots.txt`} target="_blank" rel="noreferrer">robots.txt ↗</a><a className="adminButton" href={`${siteUrl}/sitemap.xml`} target="_blank" rel="noreferrer">sitemap.xml ↗</a></div>
    </section>

    <section className="contentCard formCard"><div className="title"><div><h2>SEO для маршрута</h2><p className="subtitle">Если canonical не задан вручную, публичный сайт формирует его из production SITE URL и пути страницы.</p></div></div><form action={saveSeoRoute} className="adminForm"><div className="formGrid two"><label><span>Путь *</span><input name="path" placeholder="/products" required disabled={!prisma} /></label><label><span>Canonical</span><input name="canonical" type="url" placeholder="https://elsystar.com/products" disabled={!prisma} /></label></div><label><span>Title</span><input name="title" maxLength={160} disabled={!prisma} /></label><label><span>Description</span><textarea name="description" rows={3} maxLength={320} disabled={!prisma} /></label><div className="inlineChecks"><label className="checkLine"><input type="checkbox" name="indexable" defaultChecked disabled={!prisma} /><span>Index</span></label><label className="checkLine"><input type="checkbox" name="follow" defaultChecked disabled={!prisma} /><span>Follow</span></label></div><div className="formActions"><button className="primary" type="submit" disabled={!prisma}>Сохранить SEO</button></div></form></section>

    <section className="contentCard"><div className="title"><div><h2>Настроенные маршруты</h2><p className="subtitle">{routes.length} записей · noindex-маршруты автоматически исключаются из sitemap.</p></div></div><div className="seoList">{routes.map((route) => { const remove = deleteSeoRoute.bind(null, route.id); return <article key={route.id}><div><strong>{route.path}</strong><span>{route.title || "Title не задан"}</span><small>{route.indexable ? "index" : "noindex"}, {route.follow ? "follow" : "nofollow"}{route.canonical ? ` · canonical: ${route.canonical}` : " · canonical автоматически"}</small></div><form action={remove}><button type="submit">Удалить</button></form></article>; })}</div>{!routes.length && <p className="empty">Индивидуальные SEO-настройки пока не созданы.</p>}</section>

    <section className="contentCard formCard" id="redirects"><div className="title"><div><h2>301 / 302 redirects</h2><p className="subtitle">Старые URL ELSYSTAR должны перенаправляться на максимально близкую новую страницу, чтобы сохранять поисковые сигналы и внешние ссылки.</p></div></div><form action={createRedirect} className="adminForm"><div className="formGrid three"><label><span>Старый путь *</span><input name="fromPath" placeholder="/old-page.html" required disabled={!prisma} /></label><label><span>Куда перенаправить *</span><input name="toPath" placeholder="/products" required disabled={!prisma} /></label><label><span>Код</span><select name="status" defaultValue="301" disabled={!prisma}><option value="301">301 permanent</option><option value="302">302 temporary</option></select></label></div><div className="formActions"><button className="primary" type="submit" disabled={!prisma}>Добавить redirect</button></div></form>
      <div className="redirectList">{redirects.map((rule) => { const toggle = toggleRedirect.bind(null, rule.id, !rule.enabled); const remove = deleteRedirect.bind(null, rule.id); return <article key={rule.id}><div><strong>{rule.fromPath}</strong><span>→ {rule.toPath}</span><small>{rule.status} · {rule.enabled ? "активен" : "выключен"}</small></div><div className="rowActions"><form action={toggle}><button type="submit">{rule.enabled ? "Выключить" : "Включить"}</button></form><form action={remove}><button type="submit">Удалить</button></form></div></article>; })}</div>
    </section>
    <footer>v0.2.0-beta.2 · SEO, Migration & Internet Visibility</footer>
  </main></div>;
}
