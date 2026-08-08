import { ContentStatus, isDatabaseConfigured, prisma, SolutionType } from "@elsystar/database";
import { requireAdmin } from "../../lib/auth";
import { logout } from "../login/actions";
import { createSolution } from "./actions";

const statusLabel = { [ContentStatus.DRAFT]: "Черновик", [ContentStatus.PUBLISHED]: "Опубликовано", [ContentStatus.ARCHIVED]: "Архив" };

export default async function SolutionsAdmin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const configured = isDatabaseConfigured() && Boolean(prisma);
  const items = configured && prisma ? await prisma.solution.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] }).catch(() => []) : [];

  return (
    <div className="admin">
      <aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a className="active" href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a></nav></aside>
      <main>
        <header><div><span>Контент</span><h1>Решения</h1></div><div className="headerActions"><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
        {!configured && <div className="adminNotice">Подключите <code>DATABASE_URL</code>, чтобы управлять решениями.</div>}
        {params.error === "required" && <div className="adminError">Название и краткое описание обязательны.</div>}

        <section className="contentCard"><div className="title"><div><h2>Решения и платформы</h2><p className="subtitle">{items.length} записей</p></div><a href="#new">+ Добавить</a></div>
          {items.length ? <div className="productTableWrap"><table className="productTable"><thead><tr><th>Название</th><th>Тип</th><th>Статус</th><th>На главной</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>/{item.slug}</small></td><td>{item.type === SolutionType.PLATFORM ? "Платформа" : "Решение"}</td><td><span className={`status status-${item.status.toLowerCase()}`}>{statusLabel[item.status]}</span></td><td>{item.featured ? "Да" : "—"}</td><td><a className="tableLink" href={`/solutions/${item.id}`}>Редактировать →</a></td></tr>)}</tbody></table></div> : <p className="empty">Решений пока нет.</p>}
        </section>

        <section className="contentCard formCard" id="new"><div className="title"><div><h2>Новое решение</h2><p className="subtitle">Для «Мегаполиса» выберите тип «Платформа».</p></div></div>
          <form action={createSolution} className="adminForm"><div className="formGrid two"><label><span>Название *</span><input name="name" required disabled={!configured} /></label><label><span>URL</span><input name="slug" placeholder="megapolis" disabled={!configured} /></label><label><span>Тип</span><select name="type" defaultValue={SolutionType.SOLUTION} disabled={!configured}><option value={SolutionType.SOLUTION}>Решение</option><option value={SolutionType.PLATFORM}>Платформа</option></select></label><label><span>Статус</span><select name="status" defaultValue={ContentStatus.DRAFT} disabled={!configured}><option value={ContentStatus.DRAFT}>Черновик</option><option value={ContentStatus.PUBLISHED}>Опубликовано</option></select></label></div><label><span>Краткое описание *</span><textarea name="shortDescription" rows={3} required disabled={!configured} /></label><div className="formActions"><button className="primary" type="submit" disabled={!configured}>Создать решение</button></div></form>
        </section>
        <footer>v0.1.0-alpha.4 · Solutions CMS</footer>
      </main>
    </div>
  );
}
