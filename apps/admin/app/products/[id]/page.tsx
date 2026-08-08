import { isDatabaseConfigured, prisma, ProductRelationType, ProductStatus } from "@elsystar/database";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { logout } from "../../login/actions";
import {
  addConfiguration,
  addFeature,
  addProductMedia,
  addProductRelation,
  addSpecification,
  archiveProduct,
  deleteConfiguration,
  deleteFeature,
  deleteProductMedia,
  deleteProductRelation,
  deleteSpecification,
  setPrimaryMedia,
  updateProduct,
} from "../actions";

const relationLabel: Record<ProductRelationType, string> = {
  COMPATIBLE: "Совместимый",
  ACCESSORY: "Комплектующее",
  ALTERNATIVE: "Альтернатива",
  RELATED: "Связанный товар",
};

export default async function ProductEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  if (!isDatabaseConfigured() || !prisma) redirect("/products?error=db");

  const [product, categories, solutions, projects, otherProducts] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        specifications: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        features: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        configurations: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        mediaAssets: { where: { type: "IMAGE" }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] },
        documents: { orderBy: { createdAt: "desc" } },
        solutions: { select: { id: true, name: true } },
        projects: { select: { id: true, title: true } },
        outgoingRelations: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }], include: { targetProduct: { select: { model: true, name: true } } } },
      },
    }),
    prisma.productCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { parent: { select: { name: true } } } }),
    prisma.solution.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.project.findMany({ orderBy: [{ year: "desc" }, { title: "asc" }], select: { id: true, title: true, year: true } }),
    prisma.product.findMany({ where: { id: { not: id } }, orderBy: { model: "asc" }, select: { id: true, model: true, name: true } }),
  ]);
  if (!product) notFound();

  const selectedSolutions = new Set(product.solutions.map((item) => item.id));
  const selectedProjects = new Set(product.projects.map((item) => item.id));
  const publicSite = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6300";

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a className="active" href="/products">Продукция</a><a href="/products/categories">Категории</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="/seo">SEO</a><a href="/users">Пользователи</a><a href="/audit">Журнал действий</a></nav></aside><main>
    <header><div><span>Продукция / {product.model}</span><h1>{product.name}</h1></div><div className="headerActions"><a className="adminButton" href={`${publicSite}/products/${product.slug}`} target="_blank" rel="noreferrer">Публичная страница ↗</a><a className="adminButton" href="/products">← Каталог</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {query.error === "spec" && <div className="adminError">Для характеристики нужны название и значение.</div>}
    {query.error === "required" && <div className="adminError">Заполните обязательные поля продукта.</div>}

    <section className="contentCard formCard"><div className="title"><div><h2>Основные данные</h2><p className="subtitle">Последнее изменение: {product.updatedAt.toLocaleString("ru-RU")}</p></div><span className={`status status-${product.status.toLowerCase()}`}>{product.status === ProductStatus.PUBLISHED ? "Опубликован" : product.status === ProductStatus.ARCHIVED ? "Архив" : "Черновик"}</span></div>
      <form action={updateProduct.bind(null, product.id)} className="adminForm">
        <div className="formGrid two"><label><span>Модель *</span><input name="model" defaultValue={product.model} required /></label><label><span>Название *</span><input name="name" defaultValue={product.name} required /></label><label><span>URL *</span><input name="slug" defaultValue={product.slug} required /></label><label><span>Статус</span><select name="status" defaultValue={product.status}><option value={ProductStatus.DRAFT}>Черновик</option><option value={ProductStatus.PUBLISHED}>Опубликован</option><option value={ProductStatus.ARCHIVED}>Архив</option></select></label><label><span>Категория</span><select name="categoryId" defaultValue={product.categoryId ?? ""}><option value="">Без категории</option>{categories.map((category)=><option key={category.id} value={category.id}>{category.parent ? `${category.parent.name} → ` : ""}{category.name}</option>)}</select></label><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue={product.sortOrder} /></label></div>
        <label><span>Краткое описание *</span><textarea name="shortDescription" rows={3} defaultValue={product.shortDescription} required /></label><label><span>Полное описание</span><textarea name="description" rows={7} defaultValue={product.description ?? ""} /></label><label className="checkbox"><input name="featured" type="checkbox" defaultChecked={product.featured} /><span>Показывать среди основных продуктов</span></label>
        <div className="relationGrid"><label><span>Связанные решения</span><select name="solutionIds" multiple size={Math.min(Math.max(solutions.length, 4), 9)} defaultValue={[...selectedSolutions]}>{solutions.map((solution)=><option key={solution.id} value={solution.id}>{solution.name}</option>)}</select><small>Ctrl/Cmd — выбрать несколько.</small></label><label><span>Связанные проекты</span><select name="projectIds" multiple size={Math.min(Math.max(projects.length, 4), 9)} defaultValue={[...selectedProjects]}>{projects.map((project)=><option key={project.id} value={project.id}>{project.year ? `${project.year} · ` : ""}{project.title}</option>)}</select><small>Ctrl/Cmd — выбрать несколько.</small></label></div>
        <div className="formDivider"><strong>SEO</strong></div><div className="formGrid two"><label><span>Title</span><input name="seoTitle" defaultValue={product.seoTitle ?? ""} /></label><label><span>Description</span><input name="seoDescription" defaultValue={product.seoDescription ?? ""} /></label></div><div className="formActions"><button className="primary" type="submit">Сохранить изменения</button></div>
      </form>
    </section>

    <section className="contentCard" id="media"><div className="title"><div><h2>Изображения и галерея</h2><p className="subtitle">Главное изображение используется в каталоге и первом экране карточки.</p></div><span>{product.mediaAssets.length}</span></div>
      <div className="productMediaGrid">{product.mediaAssets.map((asset)=><article key={asset.id}><img src={asset.url} alt={asset.alt ?? asset.title} /><div><strong>{asset.title}</strong><small>{asset.isPrimary ? "Главное изображение" : `Порядок: ${asset.sortOrder}`}</small></div><div className="rowActions">{!asset.isPrimary && <form action={setPrimaryMedia.bind(null, asset.id, product.id)}><button type="submit">Сделать главным</button></form>}<form action={deleteProductMedia.bind(null, asset.id, product.id)}><button className="dangerText" type="submit">Удалить</button></form></div></article>)}</div>
      <form action={addProductMedia.bind(null, product.id)} className="inlineForm mediaInline"><label><span>Название</span><input name="title" required /></label><label><span>URL изображения</span><input name="url" type="url" required /></label><label><span>Alt</span><input name="alt" /></label><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue="0" /></label><label className="checkLine"><input name="isPrimary" type="checkbox" /><span>Главное</span></label><button className="primary" type="submit">Добавить</button></form>
    </section>

    <section className="catalogEditorGrid"><article className="contentCard" id="features"><div className="title"><div><h2>Преимущества</h2><p className="subtitle">Короткие содержательные преимущества.</p></div><span>{product.features.length}</span></div>{product.features.map((feature)=><div className="featureAdminRow" key={feature.id}><div><strong>{feature.title}</strong><p>{feature.description}</p></div><form action={deleteFeature.bind(null, feature.id, product.id)}><button className="dangerText" type="submit">Удалить</button></form></div>)}<form action={addFeature.bind(null, product.id)} className="adminForm compactForm"><label><span>Заголовок</span><input name="title" required /></label><label><span>Описание</span><textarea name="description" rows={2} /></label><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue="0" /></label><button className="primary" type="submit">Добавить преимущество</button></form></article>
      <article className="contentCard" id="configurations"><div className="title"><div><h2>Комплектации</h2><p className="subtitle">Варианты исполнения и поставки.</p></div><span>{product.configurations.length}</span></div>{product.configurations.map((configuration)=><div className="featureAdminRow" key={configuration.id}><div><strong>{configuration.name}</strong><span>{configuration.sku || "Без кода"}</span><p>{configuration.description}</p></div><form action={deleteConfiguration.bind(null, configuration.id, product.id)}><button className="dangerText" type="submit">Удалить</button></form></div>)}<form action={addConfiguration.bind(null, product.id)} className="adminForm compactForm"><label><span>Название</span><input name="name" required /></label><label><span>Код / SKU</span><input name="sku" /></label><label><span>Описание</span><textarea name="description" rows={2} /></label><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue="0" /></label><button className="primary" type="submit">Добавить комплектацию</button></form></article></section>

    <section className="contentCard" id="specifications"><div className="title"><div><h2>Технические характеристики</h2><p className="subtitle">Структурированные параметры публичной карточки.</p></div><span>{product.specifications.length}</span></div>{product.specifications.length ? <div className="specList">{product.specifications.map((specification)=><div key={specification.id} className="specRow"><div><strong>{specification.label}</strong><span>{specification.value}{specification.unit ? ` ${specification.unit}` : ""}</span></div><form action={deleteSpecification.bind(null, specification.id, product.id)}><button className="dangerText" type="submit">Удалить</button></form></div>)}</div> : <p className="empty">Характеристики ещё не добавлены.</p>}<form action={addSpecification.bind(null, product.id)} className="inlineForm"><label><span>Параметр</span><input name="label" required /></label><label><span>Значение</span><input name="value" required /></label><label><span>Ед.</span><input name="unit" /></label><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue="0" /></label><button className="primary" type="submit">Добавить</button></form></section>

    <section className="contentCard" id="relations"><div className="title"><div><h2>Совместимость и связанные товары</h2><p className="subtitle">Показывается на публичной карточке.</p></div><span>{product.outgoingRelations.length}</span></div><div className="relationCards">{product.outgoingRelations.map((relation)=><article key={relation.id}><div><span>{relationLabel[relation.type]}</span><strong>{relation.targetProduct.model}</strong><small>{relation.targetProduct.name}</small></div><form action={deleteProductRelation.bind(null, relation.id, product.id)}><button className="dangerText" type="submit">Удалить</button></form></article>)}</div><form action={addProductRelation.bind(null, product.id)} className="inlineForm relationInline"><label><span>Товар</span><select name="targetProductId" required><option value="">Выберите…</option>{otherProducts.map((item)=><option key={item.id} value={item.id}>{item.model} · {item.name}</option>)}</select></label><label><span>Тип связи</span><select name="type" defaultValue={ProductRelationType.RELATED}>{Object.values(ProductRelationType).map((type)=><option key={type} value={type}>{relationLabel[type]}</option>)}</select></label><button className="primary" type="submit">Добавить связь</button></form></section>

    <section className="contentCard"><div className="title"><div><h2>Документы</h2><p className="subtitle">Инструкции, сертификаты, ПО и прошивки уже привязываются через Documentation Center.</p></div><a href="/documents">Управлять →</a></div>{product.documents.length ? <div className="list">{product.documents.map((document)=><div key={document.id}><span>{document.title}</span><strong>{document.version ?? "—"}</strong></div>)}</div> : <p className="empty">Документы пока не привязаны.</p>}</section>
    {product.status !== ProductStatus.ARCHIVED && <section className="dangerZone"><div><strong>Архивировать продукт</strong><p>Он останется в базе и истории, но будет исключён из активного каталога.</p></div><form action={archiveProduct.bind(null, product.id)}><button type="submit">В архив</button></form></section>}
    <footer>v0.1.0-alpha.6 · Product Catalog Completion</footer>
  </main></div>;
}
