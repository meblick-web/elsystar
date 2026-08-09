import { ContentStatus, isDatabaseConfigured, prisma, ProductStatus } from "@elsystar/database";
import { requireAdmin } from "../../lib/auth";
import { logout } from "../login/actions";

interface QaIssue {
  key: string;
  type: "product" | "solution" | "project" | "document" | "corporate";
  title: string;
  detail: string;
  href: string;
}

async function loadQa() {
  const configured = isDatabaseConfigured() && Boolean(prisma);
  if (!configured || !prisma) return { configured, issues: [] as QaIssue[], counts: { products: 0, solutions: 0, projects: 0, documents: 0 } };

  const [products, solutions, projects, series, corporate] = await Promise.all([
    prisma.product.findMany({
      where: { status: ProductStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { model: "asc" }],
      select: { id: true, model: true, name: true, description: true, _count: { select: { mediaAssets: true, specifications: true, features: true, documents: true } } },
    }),
    prisma.solution.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, description: true, imageUrl: true },
    }),
    prisma.project.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
      select: {
        id: true, title: true, coverImageUrl: true, challenge: true, solutionText: true, result: true, isDemo: true,
        metric1Value: true, metric1Label: true, metric2Value: true, metric2Label: true, metric3Value: true, metric3Label: true,
      },
    }),
    prisma.documentSeries.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { id: true, title: true, _count: { select: { versions: true } } },
    }),
    prisma.corporateContent.findUnique({ where: { id: "corporate" }, select: { aboutBody: true, historyBody: true, productionBody: true, address: true, workingHours: true, inn: true, kpp: true, ogrn: true } }),
  ]);

  const issues: QaIssue[] = [];

  for (const product of products) {
    if (!product.description) issues.push({ key: `product-${product.id}-description`, type: "product", title: `${product.model} · ${product.name}`, detail: "Нет полного описания товара.", href: `/products/${product.id}` });
    if (!product._count.mediaAssets) issues.push({ key: `product-${product.id}-image`, type: "product", title: `${product.model} · ${product.name}`, detail: "Нет изображения в медиатеке товара.", href: `/products/${product.id}` });
    if (!product._count.specifications) issues.push({ key: `product-${product.id}-specs`, type: "product", title: `${product.model} · ${product.name}`, detail: "Нет технических характеристик.", href: `/products/${product.id}` });
    if (!product._count.features) issues.push({ key: `product-${product.id}-features`, type: "product", title: `${product.model} · ${product.name}`, detail: "Нет преимуществ/особенностей.", href: `/products/${product.id}` });
  }

  for (const solution of solutions) {
    if (!solution.description) issues.push({ key: `solution-${solution.id}-description`, type: "solution", title: solution.name, detail: "Нет полного описания решения.", href: `/solutions/${solution.id}` });
    if (!solution.imageUrl) issues.push({ key: `solution-${solution.id}-image`, type: "solution", title: solution.name, detail: "Не задано изображение решения.", href: `/solutions/${solution.id}` });
  }

  for (const project of projects) {
    if (!project.coverImageUrl) issues.push({ key: `project-${project.id}-image`, type: "project", title: project.title, detail: "Не задана обложка проекта.", href: `/projects/${project.id}` });
    if (!project.challenge) issues.push({ key: `project-${project.id}-challenge`, type: "project", title: project.title, detail: "Не заполнена задача проекта.", href: `/projects/${project.id}` });
    if (!project.solutionText) issues.push({ key: `project-${project.id}-solution`, type: "project", title: project.title, detail: "Не заполнено решение проекта.", href: `/projects/${project.id}` });
    if (!project.result) issues.push({ key: `project-${project.id}-result`, type: "project", title: project.title, detail: "Не заполнен результат проекта.", href: `/projects/${project.id}` });
    const metricPairs = [[project.metric1Value, project.metric1Label], [project.metric2Value, project.metric2Label], [project.metric3Value, project.metric3Label]];
    const validMetrics = metricPairs.filter(([value, label]) => Boolean(value && label)).length;
    if (validMetrics === 0) issues.push({ key: `project-${project.id}-metrics`, type: "project", title: project.title, detail: "Нет KPI для карточки проекта.", href: `/projects/${project.id}` });
    if (project.isDemo && !project.title.toLowerCase().includes("демо")) issues.push({ key: `project-${project.id}-demo-title`, type: "project", title: project.title, detail: "Проект помечен как демо: проверьте, что формулировки не выглядят как заявление о реальном внедрении.", href: `/projects/${project.id}` });
  }

  for (const item of series) {
    if (!item._count.versions) issues.push({ key: `document-${item.id}`, type: "document", title: item.title, detail: "Серия документа создана, но в ней нет ни одной версии.", href: `/documents/${item.id}` });
  }

  if (corporate) {
    if (!corporate.aboutBody) issues.push({ key: "corporate-about", type: "corporate", title: "О компании", detail: "Не заполнен основной текст раздела «О компании».", href: "/corporate" });
    if (!corporate.productionBody) issues.push({ key: "corporate-production", type: "corporate", title: "Производство", detail: "Не заполнен подробный текст производства.", href: "/corporate" });
    if (!corporate.address) issues.push({ key: "corporate-address", type: "corporate", title: "Контакты", detail: "Адрес пока не подтверждён и не опубликован.", href: "/corporate" });
    if (!corporate.workingHours) issues.push({ key: "corporate-hours", type: "corporate", title: "Контакты", detail: "Не указан режим работы.", href: "/corporate" });
    if (!corporate.inn || !corporate.kpp || !corporate.ogrn) issues.push({ key: "corporate-requisites", type: "corporate", title: "Реквизиты", detail: "ИНН/КПП/ОГРН заполнены не полностью. Не публикуйте их без подтверждения.", href: "/corporate" });
  }

  return { configured: true, issues, counts: { products: products.length, solutions: solutions.length, projects: projects.length, documents: series.length } };
}

const labels = { product: "Продукция", solution: "Решение", project: "Проект", document: "Документ", corporate: "Компания" };

export default async function ContentQaPage() {
  await requireAdmin();
  const data = await loadQa();
  const byType = data.issues.reduce<Record<string, number>>((acc, issue) => { acc[issue.type] = (acc[issue.type] ?? 0) + 1; return acc; }, {});

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a className="active" href="/content-qa">Контент QA</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/corporate">Компания</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="/seo">SEO</a></nav></aside><main>
    <header><div><span>Контроль наполнения</span><h1>Контент QA</h1></div><div className="headerActions"><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {!data.configured && <div className="adminNotice">Для проверки контента требуется PostgreSQL.</div>}

    <section className="contentQaSummary"><article><strong>{data.issues.length}</strong><span>замечаний</span></article><article><strong>{data.counts.products}</strong><span>опубликованных товаров</span></article><article><strong>{data.counts.solutions}</strong><span>решений</span></article><article><strong>{data.counts.projects}</strong><span>проектов</span></article></section>

    <section className="contentCard"><div className="title"><div><h2>{data.issues.length ? "Что требует внимания" : "Критичных пробелов не найдено"}</h2><p className="subtitle">Проверка не заменяет ручной визуальный просмотр, но ловит основные пробелы CMS.</p></div>{data.issues.length > 0 && <span>{Object.entries(byType).map(([type,count])=>`${labels[type as keyof typeof labels]}: ${count}`).join(" · ")}</span>}</div>
      {data.issues.length ? <div className="contentQaList">{data.issues.map((issue)=><a key={issue.key} href={issue.href}><span className={`qaType qa-${issue.type}`}>{labels[issue.type]}</span><div><strong>{issue.title}</strong><p>{issue.detail}</p></div><b>Исправить →</b></a>)}</div> : <div className="adminSuccess">Все опубликованные сущности имеют базовое наполнение для текущего дизайна.</div>}
    </section>

    <section className="contentCard"><div className="title"><div><h2>Что проверять вручную</h2><p className="subtitle">После автоматической проверки откройте публичный сайт на desktop и mobile.</p></div></div><div className="qaChecklist"><span>Главная: плотность, фоновые схемы, CTA</span><span>Каталог: изображения и характеристики</span><span>Проекты: маркировка демо и KPI</span><span>Документация: актуальные версии и ссылки</span><span>Контакты: только подтверждённые реквизиты</span></div></section>
    <footer>v0.1.0-alpha.9.3 · Content & Visual QA</footer>
  </main></div>;
}
