import { isDatabaseConfigured, prisma, ProductStatus } from "@elsystar/database";
import { requireAdmin } from "../../lib/auth";
import { logout } from "../login/actions";
import { createProduct } from "./actions";

const statusLabel = {
  [ProductStatus.DRAFT]: "Черновик",
  [ProductStatus.PUBLISHED]: "Опубликован",
  [ProductStatus.ARCHIVED]: "Архив",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const configured = isDatabaseConfigured() && Boolean(prisma);

  const products = configured && prisma
    ? await prisma.product.findMany({
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
        include: { _count: { select: { specifications: true, documents: true } } },
      }).catch(() => [])
    : [];

  return (
    <div className="admin">
      <aside>
        <div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div>
        <nav>
          <a href="/">Обзор</a>
          <a href="/#analytics">Аналитика</a>
          <a className="active" href="/products">Продукция</a>
          <a href="#">Решения</a><a href="#">Мегаполис</a><a href="#">Проекты</a>
          <a href="#">Документация</a><a href="#">Заявки</a><a href="#">Медиа</a>
          <a href="#">SEO</a><a href="#">Пользователи</a><a href="#">Журнал действий</a><a href="#">Настройки</a>
        </nav>
      </aside>

      <main>
        <header>
          <div><span>Контент</span><h1>Продукция</h1></div>
          <div className="headerActions"><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div>
        </header>

        {!configured && <div className="adminNotice">Подключите <code>DATABASE_URL</code>, чтобы добавлять и редактировать каталог.</div>}
        {params.error === "required" && <div className="adminError">Заполните модель, название и краткое описание.</div>}
        {params.error === "db" && <div className="adminError">База данных недоступна.</div>}

        <section className="contentCard">
          <div className="title"><div><h2>Каталог продукции</h2><p className="subtitle">{products.length} позиций</p></div><a href="#new">+ Добавить</a></div>
          {products.length ? (
            <div className="productTableWrap">
              <table className="productTable">
                <thead><tr><th>Модель</th><th>Название</th><th>Статус</th><th>Характеристики</th><th>Документы</th><th></th></tr></thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td><strong>{product.model}</strong></td>
                      <td><span>{product.name}</span><small>/{product.slug}</small></td>
                      <td><span className={`status status-${product.status.toLowerCase()}`}>{statusLabel[product.status]}</span></td>
                      <td>{product._count.specifications}</td>
                      <td>{product._count.documents}</td>
                      <td><a className="tableLink" href={`/products/${product.id}`}>Редактировать →</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="empty">Каталог пока пуст. Добавьте первую позицию ниже.</p>}
        </section>

        <section className="contentCard formCard" id="new">
          <div className="title"><div><h2>Новый продукт</h2><p className="subtitle">Создайте карточку, затем добавьте характеристики и документы.</p></div></div>
          <form action={createProduct} className="adminForm">
            <div className="formGrid two">
              <label><span>Модель *</span><input name="model" placeholder="УК-4.1М" required disabled={!configured} /></label>
              <label><span>Название *</span><input name="name" placeholder="Дорожный контроллер УК-4.1М" required disabled={!configured} /></label>
              <label><span>URL</span><input name="slug" placeholder="uk-4-1m" disabled={!configured} /></label>
              <label><span>Статус</span><select name="status" defaultValue={ProductStatus.DRAFT} disabled={!configured}><option value={ProductStatus.DRAFT}>Черновик</option><option value={ProductStatus.PUBLISHED}>Опубликован</option></select></label>
            </div>
            <label><span>Краткое описание *</span><textarea name="shortDescription" rows={3} placeholder="Короткое описание для каталога и первого экрана карточки." required disabled={!configured} /></label>
            <div className="formActions"><button className="primary" type="submit" disabled={!configured}>Создать продукт</button></div>
          </form>
        </section>

        <footer>v0.1.0-alpha.2 · Product Catalog Core</footer>
      </main>
    </div>
  );
}
