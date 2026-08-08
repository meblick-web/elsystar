import { AdminRole, AnalyticsEventType, prisma } from "@elsystar/database";
import { requireRole } from "../../lib/auth";
import { logout } from "../login/actions";

function topEntries(values: Array<string | null>, limit = 8) {
  const map = new Map<string, number>();
  for (const value of values) if (value) map.set(value, (map.get(value) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export default async function AnalyticsPage() {
  await requireRole(AdminRole.ADMIN, AdminRole.ANALYST);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const events = prisma ? await prisma.analyticsEvent.findMany({ where: { createdAt: { gte: since } }, select: { type: true, visitorId: true, sessionId: true, path: true, productId: true, source: true, device: true, createdAt: true }, take: 50000, orderBy: { createdAt: "asc" } }).catch(() => []) : [];
  const productIds = [...new Set(events.map((event) => event.productId).filter((id): id is string => Boolean(id)))];
  const products = prisma && productIds.length ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, model: true } }).catch(() => []) : [];
  const productNames = new Map(products.map((product) => [product.id, product.model]));

  const views = events.filter((event) => event.type === AnalyticsEventType.PAGE_VIEW);
  const visitors = new Set(views.map((event) => event.visitorId)).size;
  const sessions = new Set(views.map((event) => event.sessionId).filter(Boolean)).size;
  const leads = events.filter((event) => event.type === AnalyticsEventType.LEAD_SUBMIT).length;
  const productViews = events.filter((event) => event.type === AnalyticsEventType.PRODUCT_VIEW);
  const downloads = events.filter((event) => event.type === AnalyticsEventType.DOCUMENT_DOWNLOAD).length;
  const cta = events.filter((event) => event.type === AnalyticsEventType.CTA_CLICK).length;
  const conversion = visitors ? ((leads / visitors) * 100).toFixed(1) : "0.0";
  const pageTop = topEntries(views.map((event) => event.path));
  const sources = topEntries(views.map((event) => event.source));
  const devices = topEntries(views.map((event) => event.device));
  const productTop = topEntries(productViews.map((event) => event.productId)).map(([id, count]) => [productNames.get(id) ?? id, count] as [string, number]);
  const days = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(since); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() + index + 1);
    const next = new Date(day); next.setDate(next.getDate() + 1);
    return { date: day, count: views.filter((event) => event.createdAt >= day && event.createdAt < next).length };
  });
  const maxDay = Math.max(1, ...days.map((day) => day.count));

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a className="active" href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="/seo">SEO</a><a href="/users">Пользователи</a><a href="/audit">Журнал действий</a></nav></aside><main>
    <header><div><span>30 дней</span><h1>Аналитика сайта</h1></div><div className="headerActions"><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {!prisma && <div className="adminNotice">Подключите PostgreSQL — после этого здесь появится реальная статистика.</div>}
    <section className="analyticsMetrics"><article><span>Посетители</span><strong>{visitors}</strong></article><article><span>Сессии</span><strong>{sessions}</strong></article><article><span>Просмотры</span><strong>{views.length}</strong></article><article><span>Просмотры товаров</span><strong>{productViews.length}</strong></article><article><span>Скачивания</span><strong>{downloads}</strong></article><article><span>Заявки</span><strong>{leads}</strong></article><article><span>Конверсия</span><strong>{conversion}%</strong></article><article><span>CTA-клики</span><strong>{cta}</strong></article></section>
    <section className="contentCard"><div className="title"><div><h2>Динамика просмотров</h2><p className="subtitle">Последние 30 дней</p></div></div><div className="analyticsBars">{days.map((day) => <i key={day.date.toISOString()} title={`${day.date.toLocaleDateString("ru-RU")}: ${day.count}`} style={{ height: `${Math.max(3, Math.round(day.count / maxDay * 100))}%` }} />)}</div></section>
    <section className="analyticsGrid"><article className="contentCard"><h2>Популярные страницы</h2><div className="rankList">{pageTop.map(([name,count],i)=><div key={name}><span><b>{i+1}</b>{name}</span><strong>{count}</strong></div>)}</div></article><article className="contentCard"><h2>Источники</h2><div className="rankList">{sources.map(([name,count])=><div key={name}><span>{name}</span><strong>{count}</strong></div>)}</div></article><article className="contentCard"><h2>Устройства</h2><div className="rankList">{devices.map(([name,count])=><div key={name}><span>{name}</span><strong>{count}</strong></div>)}</div></article><article className="contentCard"><h2>Продукция</h2><div className="rankList">{productTop.map(([name,count])=><div key={name}><span>{name}</span><strong>{count}</strong></div>)}</div></article></section>
    <footer>v0.1.0-alpha.5 · Analytics Operations</footer>
  </main></div>;
}
