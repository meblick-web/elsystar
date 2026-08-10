import { ContentStatus, isDatabaseConfigured, prisma, ProductStatus } from "@elsystar/database";
import { requireAdmin } from "../../lib/auth";
import { logout } from "../login/actions";

interface QaIssue {
  key: string;
  type: "product" | "solution" | "project" | "document" | "corporate" | "locale";
  severity: "error" | "warning";
  title: string;
  detail: string;
  href: string;
}

async function loadQa() {
  const configured = isDatabaseConfigured() && Boolean(prisma);
  if (!configured || !prisma) return { configured, issues: [] as QaIssue[], counts: { products: 0, solutions: 0, projects: 0, documents: 0, categories: 0 } };

  const [products, solutions, projects, series, corporate, categories, translations] = await Promise.all([
    prisma.product.findMany({
      where: { status: ProductStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { model: "asc" }],
      select: {
        id: true, slug: true, model: true, name: true, description: true,
        category: { select: { slug: true, name: true } },
        mediaAssets: { where: { type: "IMAGE" }, select: { url: true, isPrimary: true } },
        _count: { select: { specifications: true, features: true, configurations: true, documentSeries: true, outgoingRelations: true } },
      },
    }),
    prisma.solution.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, slug: true, name: true, description: true, imageUrl: true },
    }),
    prisma.project.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
      select: {
        id: true, slug: true, title: true, coverImageUrl: true, challenge: true, solutionText: true, result: true, isDemo: true,
        metric1Value: true, metric1Label: true, metric2Value: true, metric2Label: true, metric3Value: true, metric3Label: true,
      },
    }),
    prisma.documentSeries.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true, title: true, language: true,
        versions: { select: { isCurrent: true, isPublic: true, publishedAt: true, fileUrl: true } },
      },
    }),
    prisma.corporateContent.findUnique({ where: { id: "corporate" }, select: { aboutBody: true, historyBody: true, productionBody: true, address: true, workingHours: true, inn: true, kpp: true, ogrn: true } }),
    prisma.productCategory.count(),
    prisma.contentTranslation.findMany({ where: { locale: "en", field: { in: ["name", "title"] } }, select: { entityType: true, entityId: true, field: true } }),
  ]);

  const issues: QaIssue[] = [];
  const enPrimary = new Set(translations.map((item) => `${item.entityType}:${item.entityId}:${item.field}`));

  for (const product of products) {
    const title = `${product.model} · ${product.name}`;
    const isController = product.category?.slug === "road-controllers";
    if (!product.description) issues.push({ key: `product-${product.id}-description`, type: "product", severity: "error", title, detail: "Нет полного описания товара.", href: `/products/${product.id}` });
    if (!product.mediaAssets.length) issues.push({ key: `product-${product.id}-image`, type: "product", severity: isController ? "error" : "warning", title, detail: isController ? "Нет изображения дорожного контроллера в медиатеке." : "Нет отдельного технического изображения. Допустим системный placeholder, но перед production желательно добавить собственное фото.", href: `/products/${product.id}` });
    if (product.mediaAssets.some((item) => item.url.includes("images.unsplash.com"))) issues.push({ key: `product-${product.id}-temporary-image`, type: "product", severity: "warning", title, detail: "Используется временное Unsplash-изображение. Перед релизом замените его собственным или подтверждённым техническим фото.", href: `/products/${product.id}` });
    if (!product._count.specifications) issues.push({ key: `product-${product.id}-specs`, type: "product", severity: isController ? "error" : "warning", title, detail: isController ? "Нет технических характеристик контроллера." : "Для компонента нет подтверждённых технических характеристик. Не заполняйте их предположениями.", href: `/products/${product.id}` });
    if (!product._count.features) issues.push({ key: `product-${product.id}-features`, type: "product", severity: "warning", title, detail: "Нет особенностей/преимуществ для карточки товара.", href: `/products/${product.id}` });
    if (isController && !product._count.configurations) issues.push({ key: `product-${product.id}-configurations`, type: "product", severity: "error", title, detail: "Для дорожного контроллера не заполнены варианты комплектации.", href: `/products/${product.id}` });
    if (isController && !product._count.documentSeries) issues.push({ key: `product-${product.id}-documents`, type: "document", severity: "warning", title, detail: "К контроллеру не привязана ни одна серия технических документов.", href: "/documents" });
    if (isController && !product._count.outgoingRelations) issues.push({ key: `product-${product.id}-relations`, type: "product", severity: "warning", title, detail: "Не заполнены совместимые модули, пульты или аксессуары.", href: `/products/${product.id}` });
    if (!enPrimary.has(`Product:${product.slug}:name`)) issues.push({ key: `product-${product.id}-en`, type: "locale", severity: "warning", title, detail: "Нет английского названия опубликованного товара.", href: `/localization?q=${encodeURIComponent(product.slug)}` });
  }

  for (const solution of solutions) {
    if (!solution.description) issues.push({ key: `solution-${solution.id}-description`, type: "solution", severity: "error", title: solution.name, detail: "Нет полного описания решения.", href: `/solutions/${solution.id}` });
    if (!solution.imageUrl) issues.push({ key: `solution-${solution.id}-image`, type: "solution", severity: "warning", title: solution.name, detail: "Не задано изображение решения: публичная страница использует технический placeholder.", href: `/solutions/${solution.id}` });
    if (solution.imageUrl?.includes("images.unsplash.com")) issues.push({ key: `solution-${solution.id}-temporary-image`, type: "solution", severity: "warning", title: solution.name, detail: "Используется временное Unsplash-изображение; нужна собственная или подтверждённая техническая иллюстрация.", href: `/solutions/${solution.id}` });
    if (!enPrimary.has(`Solution:${solution.slug}:name`)) issues.push({ key: `solution-${solution.id}-en`, type: "locale", severity: "warning", title: solution.name, detail: "Нет английского названия опубликованного решения.", href: `/localization?q=${encodeURIComponent(solution.slug)}` });
  }

  for (const project of projects) {
    if (!project.coverImageUrl) issues.push({ key: `project-${project.id}-image`, type: "project", severity: "warning", title: project.title, detail: "Не задана обложка проекта.", href: `/projects/${project.id}` });
    if (!project.challenge) issues.push({ key: `project-${project.id}-challenge`, type: "project", severity: "error", title: project.title, detail: "Не заполнена задача проекта.", href: `/projects/${project.id}` });
    if (!project.solutionText) issues.push({ key: `project-${project.id}-solution`, type: "project", severity: "error", title: project.title, detail: "Не заполнено решение проекта.", href: `/projects/${project.id}` });
    if (!project.result) issues.push({ key: `project-${project.id}-result`, type: "project", severity: "error", title: project.title, detail: "Не заполнен результат проекта.", href: `/projects/${project.id}` });
    const metricPairs = [[project.metric1Value, project.metric1Label], [project.metric2Value, project.metric2Label], [project.metric3Value, project.metric3Label]];
    const validMetrics = metricPairs.filter(([value, label]) => Boolean(value && label)).length;
    if (validMetrics === 0) issues.push({ key: `project-${project.id}-metrics`, type: "project", severity: "warning", title: project.title, detail: "Нет KPI для карточки проекта.", href: `/projects/${project.id}` });
    if (project.isDemo && !project.title.toLowerCase().includes("демо")) issues.push({ key: `project-${project.id}-demo-title`, type: "project", severity: "error", title: project.title, detail: "Проект помечен как демо: формулировки не должны выглядеть как заявление о реальном внедрении.", href: `/projects/${project.id}` });
    if (!project.isDemo && !enPrimary.has(`Project:${project.slug}:title`)) issues.push({ key: `project-${project.id}-en`, type: "locale", severity: "warning", title: project.title, detail: "У реального опубликованного проекта нет английского заголовка.", href: `/localization?q=${encodeURIComponent(project.slug)}` });
  }

  for (const item of series) {
    if (!item.versions.length) issues.push({ key: `document-${item.id}-empty`, type: "document", severity: "error", title: item.title, detail: "Серия документа создана, но в ней нет ни одной версии.", href: `/documents/${item.id}` });
    const publicVersions = item.versions.filter((version) => version.isPublic && version.publishedAt);
    if (item.versions.length && !publicVersions.length) issues.push({ key: `document-${item.id}-unpublished`, type: "document", severity: "warning", title: item.title, detail: "В серии нет опубликованной версии.", href: `/documents/${item.id}` });
    if (publicVersions.length && !publicVersions.some((version) => version.isCurrent)) issues.push({ key: `document-${item.id}-current`, type: "document", severity: "warning", title: item.title, detail: "Опубликованные версии есть, но ни одна не отмечена как текущая.", href: `/documents/${item.id}` });
    if (publicVersions.some((version) => !/^https:\/\//i.test(version.fileUrl))) issues.push({ key: `document-${item.id}-https`, type: "document", severity: "warning", title: item.title, detail: "Ссылка на файл не использует HTTPS.", href: `/documents/${item.id}` });
  }

  if (corporate) {
    if (!corporate.aboutBody) issues.push({ key: "corporate-about", type: "corporate", severity: "error", title: "О компании", detail: "Не заполнен основной текст раздела «О компании».", href: "/corporate" });
    if (!corporate.productionBody) issues.push({ key: "corporate-production", type: "corporate", severity: "error", title: "Производство", detail: "Не заполнен подробный текст производства.", href: "/corporate" });
    if (!corporate.address) issues.push({ key: "corporate-address", type: "corporate", severity: "warning", title: "Контакты", detail: "Адрес не подтверждён. Это не блокирует релиз: не публикуйте адрес только ради прохождения QA.", href: "/corporate" });
    if (!corporate.workingHours) issues.push({ key: "corporate-hours", type: "corporate", severity: "warning", title: "Контакты", detail: "Не указан подтверждённый режим работы.", href: "/corporate" });
    if (!corporate.inn || !corporate.kpp || !corporate.ogrn) issues.push({ key: "corporate-requisites", type: "corporate", severity: "warning", title: "Реквизиты", detail: "ИНН/КПП/ОГРН заполнены не полностью. Не придумывайте и не публикуйте их без подтверждения.", href: "/corporate" });
  }

  return { configured: true, issues, counts: { products: products.length, solutions: solutions.length, projects: projects.length, documents: series.length, categories } };
}

const labels = { product: "Продукция", solution: "Решение", project: "Проект", document: "Документ", corporate: "Компания", locale: "RU / EN" };

export default async function ContentQaPage() {
  await requireAdmin();
  const data = await loadQa();
  const critical = data.issues.filter((issue) => issue.severity === "error");
  const warnings = data.issues.filter((issue) => issue.severity === "warning");
  const byType = data.issues.reduce<Record<string, number>>((acc, issue) => { acc[issue.type] = (acc[issue.type] ?? 0) + 1; return acc; }, {});

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a className="active" href="/content-qa">Контент QA</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/corporate">Компания</a><a href="/documents">Документация</a><a href="/localization">RU / EN</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="/seo">SEO</a></nav></aside><main>
    <header><div><span>Контроль наполнения</span><h1>Контент QA</h1></div><div className="headerActions"><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {!data.configured && <div className="adminNotice">Для проверки контента требуется PostgreSQL.</div>}

    <section className="contentQaSummary"><article><strong>{critical.length}</strong><span>критичных пробелов</span></article><article><strong>{warnings.length}</strong><span>предупреждений</span></article><article><strong>{data.counts.products}</strong><span>товаров · {data.counts.categories} категорий</span></article><article><strong>{data.counts.documents}</strong><span>серий документов</span></article></section>

    <section className="contentCard"><div className="title"><div><h2>{critical.length ? "Что блокирует готовность контента" : "Критичных пробелов не найдено"}</h2><p className="subtitle">Ошибки — реальные пробелы опубликованного контента. Предупреждения могут требовать ручной проверки, но не должны заставлять придумывать данные.</p></div>{data.issues.length > 0 && <span>{Object.entries(byType).map(([type,count])=>`${labels[type as keyof typeof labels]}: ${count}`).join(" · ")}</span>}</div>
      {data.issues.length ? <div className="contentQaList">{data.issues.map((issue)=><a key={issue.key} href={issue.href} data-severity={issue.severity}><span className={`qaType qa-${issue.type}`}>{issue.severity === "error" ? "Нужно" : "Проверить"} · {labels[issue.type]}</span><div><strong>{issue.title}</strong><p>{issue.detail}</p></div><b>Открыть →</b></a>)}</div> : <div className="adminSuccess">Все опубликованные сущности имеют базовое наполнение для текущего дизайна.</div>}
    </section>

    <section className="contentCard"><div className="title"><div><h2>Ручная финальная проверка</h2><p className="subtitle">Автоматический QA не оценивает качество фотографии, актуальность сертификата или корректность коммерческой формулировки.</p></div></div><div className="qaChecklist"><span>Каталог: категории, комплектации, связи и собственные фото</span><span>Контроллеры: характеристики сверены с действующей документацией</span><span>Решения: нет случайных stock/Unsplash изображений</span><span>Проекты: демо явно отделены от подтверждённых внедрений</span><span>Документация: ссылки открываются, текущая версия выбрана осознанно</span><span>Контакты и реквизиты: только подтверждённые данные</span><span>RU / EN: новые опубликованные сущности переведены</span></div></section>
    <footer>v0.2.0-beta.5 · Content, Media & Catalog Completion</footer>
  </main></div>;
}
