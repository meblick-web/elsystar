import { AdminRole, prisma } from "@elsystar/database";
import { requireRole } from "../../../lib/auth";
import { logout } from "../../login/actions";
import { createCategory, deleteCategory, updateCategory } from "./actions";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  const query = await searchParams;
  const categories = prisma ? await prisma.productCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { parent: { select: { name: true } }, _count: { select: { products: true, children: true } } } }).catch(() => []) : [];

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a className="active" href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="/seo">SEO</a><a href="/users">Пользователи</a><a href="/audit">Журнал действий</a></nav></aside><main>
    <header><div><span>Продукция</span><h1>Категории каталога</h1></div><div className="headerActions"><a className="adminButton" href="/products">← Каталог</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {!prisma && <div className="adminNotice">Для управления категориями требуется PostgreSQL.</div>}
    {query.created && <div className="adminSuccess">Категория создана.</div>}
    {query.error === "required" && <div className="adminError">Укажите название категории.</div>}
    {query.error === "used" && <div className="adminError">Нельзя удалить категорию, пока в ней есть товары или дочерние категории.</div>}

    <section className="contentCard"><div className="title"><div><h2>Структура</h2><p className="subtitle">Категории поддерживают один уровень родительской связи и могут использоваться как дерево любой глубины.</p></div><a href="#new">+ Категория</a></div>
      <div className="categoryAdminList">{categories.map((category) => { const update = updateCategory.bind(null, category.id); const remove = deleteCategory.bind(null, category.id); return <article key={category.id}><form action={update} className="categoryEditForm"><div className="categoryIdentity"><strong>{category.name}</strong><small>{category.parent ? `${category.parent.name} → ` : ""}/{category.slug} · {category._count.products} товаров · {category._count.children} подкатегорий</small></div><input name="name" defaultValue={category.name} required /><input name="slug" defaultValue={category.slug} required /><select name="parentId" defaultValue={category.parentId ?? ""}><option value="">Без родителя</option>{categories.filter((item)=>item.id!==category.id).map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select><input name="sortOrder" type="number" defaultValue={category.sortOrder} /><input name="description" defaultValue={category.description ?? ""} placeholder="Описание" /><button type="submit">Сохранить</button></form><form action={remove}><button className="dangerText" type="submit">Удалить</button></form></article>; })}</div>
      {!categories.length && <p className="empty">Категорий пока нет.</p>}
    </section>

    <section className="contentCard formCard" id="new"><div className="title"><div><h2>Новая категория</h2><p className="subtitle">Например: «Дорожные контроллеры» или «Модули и комплектующие».</p></div></div><form action={createCategory} className="adminForm"><div className="formGrid two"><label><span>Название *</span><input name="name" required disabled={!prisma} /></label><label><span>URL</span><input name="slug" placeholder="road-controllers" disabled={!prisma} /></label><label><span>Родитель</span><select name="parentId" defaultValue="" disabled={!prisma}><option value="">Без родителя</option>{categories.map((category)=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue="0" disabled={!prisma} /></label></div><label><span>Описание</span><textarea name="description" rows={3} disabled={!prisma} /></label><div className="formActions"><button className="primary" type="submit" disabled={!prisma}>Создать категорию</button></div></form></section>
    <footer>v0.1.0-alpha.6 · Product Categories</footer>
  </main></div>;
}
