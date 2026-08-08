import {
  AnalyticsEventType,
  isDatabaseConfigured,
  prisma,
  ProductStatus,
} from "@elsystar/database";
import { requireAdmin } from "../lib/auth";
import { logout } from "./login/actions";

async function getDashboardData() {
  const configured = isDatabaseConfigured() && Boolean(prisma);
  const empty = {
    configured,
    metrics: [["Посетители", "0"], ["Просмотры", "0"], ["Заявки КП", "0"], ["Скачивания", "0"]],
    popularPages: [] as Array<[string, string]>,
    chart: Array.from({ length: 14 }, () => 0),
    catalog: { products: 0, drafts: 0, archived: 0 },
    content: { solutions: 0, projects: 0 },
    recentLeads: [] as Array<{ id: string; name: string; company: string | null; createdAt: Date }>,
  };
  if (!configured || !prisma) return empty;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const chartSince = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
  try {
    const [events, products, drafts, archived, leads, recentLeads, solutions, projects] = await Promise.all([
      prisma.analyticsEvent.findMany({ where: { createdAt: { gte: since } }, select: { type: true, visitorId: true, path: true, createdAt: true }, take: 20000 }),
      prisma.product.count(),
      prisma.product.count({ where: { status: ProductStatus.DRAFT } }),
      prisma.product.count({ where: { status: ProductStatus.ARCHIVED } }),
      prisma.lead.count({ where: { createdAt: { gte: since } } }),
      prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, company: true, createdAt: true } }),
      prisma.solution.count(),
      prisma.project.count(),
    ]);
    const pageViews = events.filter((event) => event.type === AnalyticsEventType.PAGE_VIEW);
    const visitors = new Set(pageViews.map((event) => event.visitorId)).size;
    const downloads = events.filter((event) => event.type === AnalyticsEventType.DOCUMENT_DOWNLOAD).length;
    const pageCounts = new Map<string, number>();
    for (const event of pageViews) pageCounts.set(event.path, (pageCounts.get(event.path) ?? 0) + 1);
    const popularPages = [...pageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, count]) => [path, String(count)] as [string, string]);
    const chart = Array.from({ length: 14 }, (_, index) => {
      const day = new Date(chartSince); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() + index);
      const next = new Date(day); next.setDate(next.getDate() + 1);
      return pageViews.filter((event) => event.createdAt >= day && event.createdAt < next).length;
    });
    return { configured: true, metrics: [["Посетители", String(visitors)], ["Просмотры", String(pageViews.length)], ["Заявки КП", String(leads)], ["Скачивания", String(downloads)]], popularPages, chart, catalog: { products, drafts, archived }, content: { solutions, projects }, recentLeads };
  } catch (error) {
    console.error("admin_dashboard_query_failed", error);
    return { ...empty, configured: false };
  }
}

export default async function Admin() {
  const session = await requireAdmin();
  const data = await getDashboardData();
  const maxValue = Math.max(...data.chart, 1);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6300";

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav>
    <a className="active" href="/">Обзор</a><a href="/#analytics">Аналитика</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="#">SEO</a><a href="#">Пользователи</a><a href="#">Журнал действий</a><a href="#">Настройки</a>
  </nav></aside><main>
    <header><div><span>Панель управления</span><h1>Обзор</h1></div><div className="headerActions"><span className={`dbStatus ${data.configured ? "online" : "offline"}`}>{data.configured ? "PostgreSQL подключён" : "БД не подключена"}</span><a className="adminButton" href={siteUrl} target="_blank" rel="noreferrer">Открыть сайт ↗</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    <div className="sessionLine">Выполнен вход: {session.email}</div>
    <section className="metrics" id="analytics">{data.metrics.map((metric) => <article key={metric[0]}><span>{metric[0]}</span><strong>{metric[1]}</strong><small>{data.configured ? "за последние 30 дней" : "ожидает подключения БД"}</small></article>)}</section>
    <section className="grid"><article className="chartCard"><div className="title"><h2>Просмотры страниц</h2><span>14 дней</span></div><div className="bars">{data.chart.map((value,index) => <i key={index} title={`${value} просмотров`} style={{height:`${Math.max(5, Math.round((value / maxValue) * 100))}%`}} />)}</div></article><article><div className="title"><h2>Популярные страницы</h2><span>30 дней</span></div>{data.popularPages.length ? <div className="list">{data.popularPages.map((page,index) => <div key={page[0]}><span><b>{index+1}</b>{page[0]}</span><strong>{page[1]}</strong></div>)}</div> : <p className="empty">Данные появятся после первых посещений публичного сайта.</p>}</article></section>
    <section className="grid lower"><article><div className="title"><h2>Каталог</h2><a href="/products">Управлять →</a></div><div className="catalog"><div><strong>{data.catalog.products}</strong><span>продуктов</span></div><div><strong>{data.catalog.drafts}</strong><span>черновиков</span></div><div><strong>{data.catalog.archived}</strong><span>архивных</span></div></div><a className="primary adminButton" href="/products#new">+ Добавить продукт</a></article><article><div className="title"><h2>Контент</h2><span>CMS</span></div><div className="catalog"><div><strong>{data.content.solutions}</strong><span>решений</span></div><div><strong>{data.content.projects}</strong><span>проектов</span></div></div><a className="primary adminButton" href="/homepage">Редактировать главную</a></article></section>
    <section className="quickModules"><a href="/homepage"><strong>Главная</strong><span>Hero, CTA и заголовки секций →</span></a><a href="/solutions"><strong>Решения</strong><span>Решения и платформа «Мегаполис» →</span></a><a href="/projects"><strong>Проекты</strong><span>Внедрения и кейсы →</span></a><a href="/documents"><strong>Документация</strong><span>Руководства, сертификаты и ПО →</span></a><a href="/leads"><strong>Заявки</strong><span>Коммерческие обращения →</span></a></section>
    <footer>v0.1.0-alpha.4 · Solutions, Projects & Homepage CMS</footer>
  </main></div>;
}
