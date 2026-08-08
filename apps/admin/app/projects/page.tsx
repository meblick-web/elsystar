import { ContentStatus, isDatabaseConfigured, prisma } from "@elsystar/database";
import { requireAdmin } from "../../lib/auth";
import { logout } from "../login/actions";
import { createProject } from "./actions";

const statusLabel = { [ContentStatus.DRAFT]: "Черновик", [ContentStatus.PUBLISHED]: "Опубликован", [ContentStatus.ARCHIVED]: "Архив" };

export default async function ProjectsAdmin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const configured = isDatabaseConfigured() && Boolean(prisma);
  const projects = configured && prisma ? await prisma.project.findMany({ orderBy: [{ sortOrder: "asc" }, { year: "desc" }, { updatedAt: "desc" }], include: { _count: { select: { products: true, solutions: true } } } }).catch(() => []) : [];

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a className="active" href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a></nav></aside><main>
    <header><div><span>Контент</span><h1>Проекты</h1></div><div className="headerActions"><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {!configured && <div className="adminNotice">Подключите <code>DATABASE_URL</code>, чтобы управлять проектами.</div>}
    {params.error === "required" && <div className="adminError">Название и краткое описание обязательны.</div>}

    <section className="contentCard"><div className="title"><div><h2>Проекты и внедрения</h2><p className="subtitle">{projects.length} записей</p></div><a href="#new">+ Добавить</a></div>
      {projects.length ? <div className="productTableWrap"><table className="productTable"><thead><tr><th>Проект</th><th>География</th><th>Статус</th><th>Связи</th><th></th></tr></thead><tbody>{projects.map((project) => <tr key={project.id}><td><strong>{project.title}</strong><small>/{project.slug}</small></td><td>{[project.city, project.region, project.year].filter(Boolean).join(" · ") || "—"}</td><td><span className={`status status-${project.status.toLowerCase()}`}>{statusLabel[project.status]}</span></td><td>{project._count.products} прод. · {project._count.solutions} реш.</td><td><a className="tableLink" href={`/projects/${project.id}`}>Редактировать →</a></td></tr>)}</tbody></table></div> : <p className="empty">Проектов пока нет.</p>}
    </section>

    <section className="contentCard formCard" id="new"><div className="title"><div><h2>Новый проект</h2><p className="subtitle">Создайте карточку, затем добавьте задачу, решение, результат и связи.</p></div></div><form action={createProject} className="adminForm"><div className="formGrid two"><label><span>Название *</span><input name="title" required disabled={!configured} /></label><label><span>URL</span><input name="slug" placeholder="city-traffic-modernization" disabled={!configured} /></label><label><span>Город</span><input name="city" disabled={!configured} /></label><label><span>Регион</span><input name="region" disabled={!configured} /></label><label><span>Год</span><input type="number" name="year" min="1900" max="2100" disabled={!configured} /></label><label><span>Статус</span><select name="status" defaultValue={ContentStatus.DRAFT} disabled={!configured}><option value={ContentStatus.DRAFT}>Черновик</option><option value={ContentStatus.PUBLISHED}>Опубликован</option></select></label></div><label><span>Краткое описание *</span><textarea name="summary" rows={3} required disabled={!configured} /></label><div className="formActions"><button className="primary" type="submit" disabled={!configured}>Создать проект</button></div></form></section>
    <footer>v0.1.0-alpha.4 · Projects CMS</footer>
  </main></div>;
}
