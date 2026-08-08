import { AdminRole, isDatabaseConfigured, prisma, ProductStatus } from "@elsystar/database";
import { requireRole } from "../../lib/auth";
import { logout } from "../login/actions";
import { createProduct } from "./actions";

const statusLabel = { [ProductStatus.DRAFT]: "Черновик", [ProductStatus.PUBLISHED]: "Опубликован", [ProductStatus.ARCHIVED]: "Архив" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  const params = await searchParams;
  const configured = isDatabaseConfigured() && Boolean(prisma);
  const [products, categories] = configured && prisma ? await Promise.all([
    prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }], include: { category: { select: { name: true } }, mediaAssets: { where: { type: "IMAGE" }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 }, _count: { select: { specifications: true, documents: true, features: true, configurations: true } } } }).catch(() => []),
    prisma.productCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { parent: { select: { name: true } } } }).catch(() => []),
  ]) : [[], []];

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a className="active" href="/products">Продукция</a><a href="/products/categories">Категории</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="/seo">SEO</a><a href="/users">Пользователи</a><a href="/audit">Журнал действий</a></nav></aside><main>
    <header><div><span>Контент</span><h1>Продукция</h1></div><div className="headerActions"><a className="adminButton" href="/products/categories">Категории</a><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {!configured && <div className="adminNotice">Подключите <code>DATABASE_URL</code>, чтобы управлять каталогом.</div>}
    {params.error === "required" && <div className="adminError">Заполните модель, название и краткое описание.</div>}{params.error === "db" && <div className="adminError">База данных недоступна.</div>}

    <section className="contentCard"><div className="title"><div><h2>Каталог продукции</h2><p className="subtitle">{products.length} позиций · {categories.length} категорий</p></div><a href="#new">+ Добавить</a></div>
      {products.length ? <div className="productTableWrap"><table className="productTable"><thead><tr><th>Фото</th><th>Модель</th><th>Название</th><th>Категория</th><th>Статус</th><th>Контент</th><th>Документы</th><th></th></tr></thead><tbody>{products.map((product)=><tr key={product.id}><td>{product.mediaAssets[0] ? <img className="adminThumb" src={product.mediaAssets[0].url} alt="" /> : <span className="thumbPlaceholder">—</span>}</td><td><strong>{product.model}</strong></td><td><span>{product.name}</span><small>/{product.slug}</small></td><td>{product.category?.name ?? "—"}</td><td><span className={`status status-${product.status.toLowerCase()}`}>{statusLabel[product.status]}</span></td><td><small>{product._count.specifications} хар. · {product._count.features} преимуществ · {product._count.configurations} комплектаций</small></td><td>{product._count.documents}</td><td><a className="tableLink" href={`/products/${product.id}`}>Редактировать →</a></td></tr>)}</tbody></table></div> : <p className="empty">Каталог пока пуст. Добавьте первую позицию ниже.</p>}
    </section>

    <section className="contentCard formCard" id="new"><div className="title"><div><h2>Новый продукт</h2><p className="subtitle">После создания откроется полный редактор карточки.</p></div></div><form action={createProduct} className="adminForm"><div className="formGrid two"><label><span>Модель *</span><input name="model" placeholder="УК-4.1М" required disabled={!configured} /></label><label><span>Название *</span><input name="name" placeholder="Дорожный контроллер УК-4.1М" required disabled={!configured} /></label><label><span>URL</span><input name="slug" placeholder="uk-4-1m" disabled={!configured} /></label><label><span>Категория</span><select name="categoryId" defaultValue="" disabled={!configured}><option value="">Без категории</option>{categories.map((category)=><option key={category.id} value={category.id}>{category.parent ? `${category.parent.name} → ` : ""}{category.name}</option>)}</select></label><label><span>Статус</span><select name="status" defaultValue={ProductStatus.DRAFT} disabled={!configured}><option value={ProductStatus.DRAFT}>Черновик</option><option value={ProductStatus.PUBLISHED}>Опубликован</option></select></label></div><label><span>Краткое описание *</span><textarea name="shortDescription" rows={3} required disabled={!configured} /></label><div className="formActions"><button className="primary" type="submit" disabled={!configured}>Создать продукт</button></div></form></section>
    <footer>v0.1.0-alpha.6 · Product Catalog Completion</footer>
  </main></div>;
}
