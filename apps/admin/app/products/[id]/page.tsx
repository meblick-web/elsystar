import { isDatabaseConfigured, prisma, ProductStatus } from "@elsystar/database";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { logout } from "../../login/actions";
import {
  addSpecification,
  archiveProduct,
  deleteSpecification,
  updateProduct,
} from "../actions";

export default async function ProductEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;

  if (!isDatabaseConfigured() || !prisma) redirect("/products?error=db");

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      specifications: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) notFound();

  const updateAction = updateProduct.bind(null, product.id);
  const addSpecAction = addSpecification.bind(null, product.id);
  const archiveAction = archiveProduct.bind(null, product.id);

  return (
    <div className="admin">
      <aside>
        <div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div>
        <nav>
          <a href="/">Обзор</a><a href="/#analytics">Аналитика</a><a className="active" href="/products">Продукция</a>
          <a href="#">Решения</a><a href="#">Мегаполис</a><a href="#">Проекты</a><a href="#">Документация</a>
          <a href="#">Заявки</a><a href="#">Медиа</a><a href="#">SEO</a><a href="#">Пользователи</a><a href="#">Журнал действий</a><a href="#">Настройки</a>
        </nav>
      </aside>

      <main>
        <header>
          <div><span>Продукция / {product.model}</span><h1>{product.name}</h1></div>
          <div className="headerActions"><a className="adminButton" href="/products">← Каталог</a><form action={logout}><button type="submit">Выйти</button></form></div>
        </header>

        {query.error === "spec" && <div className="adminError">Для характеристики нужны название и значение.</div>}

        <section className="contentCard formCard">
          <div className="title"><div><h2>Основные данные</h2><p className="subtitle">Последнее изменение: {product.updatedAt.toLocaleString("ru-RU")}</p></div><span className={`status status-${product.status.toLowerCase()}`}>{product.status === ProductStatus.PUBLISHED ? "Опубликован" : product.status === ProductStatus.ARCHIVED ? "Архив" : "Черновик"}</span></div>
          <form action={updateAction} className="adminForm">
            <div className="formGrid two">
              <label><span>Модель *</span><input name="model" defaultValue={product.model} required /></label>
              <label><span>Название *</span><input name="name" defaultValue={product.name} required /></label>
              <label><span>URL *</span><input name="slug" defaultValue={product.slug} required /></label>
              <label><span>Статус</span><select name="status" defaultValue={product.status}><option value={ProductStatus.DRAFT}>Черновик</option><option value={ProductStatus.PUBLISHED}>Опубликован</option><option value={ProductStatus.ARCHIVED}>Архив</option></select></label>
            </div>
            <label><span>Краткое описание *</span><textarea name="shortDescription" rows={3} defaultValue={product.shortDescription} required /></label>
            <label><span>Полное описание</span><textarea name="description" rows={7} defaultValue={product.description ?? ""} /></label>
            <label className="checkbox"><input name="featured" type="checkbox" defaultChecked={product.featured} /><span>Показывать среди основных продуктов</span></label>

            <div className="formDivider"><strong>SEO</strong></div>
            <div className="formGrid two">
              <label><span>Title</span><input name="seoTitle" defaultValue={product.seoTitle ?? ""} /></label>
              <label><span>Description</span><input name="seoDescription" defaultValue={product.seoDescription ?? ""} /></label>
            </div>
            <div className="formActions"><button className="primary" type="submit">Сохранить изменения</button></div>
          </form>
        </section>

        <section className="contentCard" id="specifications">
          <div className="title"><div><h2>Технические характеристики</h2><p className="subtitle">Структурированные параметры для публичной карточки.</p></div><span>{product.specifications.length}</span></div>

          {product.specifications.length ? <div className="specList">{product.specifications.map((specification) => (
            <div key={specification.id} className="specRow">
              <div><strong>{specification.label}</strong><span>{specification.value}{specification.unit ? ` ${specification.unit}` : ""}</span></div>
              <form action={deleteSpecification.bind(null, specification.id, product.id)}><button className="dangerText" type="submit">Удалить</button></form>
            </div>
          ))}</div> : <p className="empty">Характеристики ещё не добавлены.</p>}

          <form action={addSpecAction} className="inlineForm">
            <label><span>Параметр</span><input name="label" placeholder="Силовые каналы" required /></label>
            <label><span>Значение</span><input name="value" placeholder="32" required /></label>
            <label><span>Ед.</span><input name="unit" placeholder="шт." /></label>
            <label><span>Порядок</span><input name="sortOrder" type="number" defaultValue="0" /></label>
            <button className="primary" type="submit">Добавить</button>
          </form>
        </section>

        <section className="contentCard">
          <div className="title"><div><h2>Документы</h2><p className="subtitle">Инструкции, сертификаты, ПО и прошивки.</p></div><span>{product.documents.length}</span></div>
          {product.documents.length ? <div className="list">{product.documents.map((document) => <div key={document.id}><span>{document.title}</span><strong>{document.version ?? "—"}</strong></div>)}</div> : <p className="empty">Документы будут подключены в модуле Documentation Center.</p>}
        </section>

        {product.status !== ProductStatus.ARCHIVED && <section className="dangerZone"><div><strong>Архивировать продукт</strong><p>Он останется в базе и истории, но будет исключён из активного каталога.</p></div><form action={archiveAction}><button type="submit">В архив</button></form></section>}

        <footer>v0.1.0-alpha.2 · Product Editor</footer>
      </main>
    </div>
  );
}
