import { ContentStatus, prisma } from "@elsystar/database";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { logout } from "../../login/actions";
import { updateProject } from "../actions";

export default async function ProjectEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  if (!prisma) notFound();
  const [project, products, solutions] = await Promise.all([
    prisma.project.findUnique({ where: { id }, include: { products: { select: { id: true } }, solutions: { select: { id: true } } } }),
    prisma.product.findMany({ orderBy: { model: "asc" }, select: { id: true, model: true, name: true } }),
    prisma.solution.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!project) notFound();
  const selectedProducts = new Set(project.products.map((item) => item.id));
  const selectedSolutions = new Set(project.solutions.map((item) => item.id));
  const action = updateProject.bind(null, id);

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a className="active" href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a></nav></aside><main>
    <header><div><span>Проект</span><h1>{project.title}</h1></div><div className="headerActions"><a className="adminButton" href="/projects">← Список</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {query.saved && <div className="adminSuccess">Изменения сохранены.</div>}
    {query.error && <div className="adminError">Проверьте обязательные поля.</div>}
    <section className="contentCard formCard"><form action={action} className="adminForm">
      <div className="formGrid two"><label><span>Название *</span><input name="title" defaultValue={project.title} required /></label><label><span>URL</span><input name="slug" defaultValue={project.slug} /></label><label><span>Город</span><input name="city" defaultValue={project.city ?? ""} /></label><label><span>Регион</span><input name="region" defaultValue={project.region ?? ""} /></label><label><span>Год</span><input type="number" min="1900" max="2100" name="year" defaultValue={project.year ?? ""} /></label><label><span>Статус</span><select name="status" defaultValue={project.status}><option value={ContentStatus.DRAFT}>Черновик</option><option value={ContentStatus.PUBLISHED}>Опубликован</option><option value={ContentStatus.ARCHIVED}>Архив</option></select></label></div>
      <label><span>Краткое описание *</span><textarea name="summary" rows={3} defaultValue={project.summary} required /></label>
      <div className="caseEditorGrid"><label><span>Задача</span><textarea name="challenge" rows={7} defaultValue={project.challenge ?? ""} /></label><label><span>Решение</span><textarea name="solutionText" rows={7} defaultValue={project.solutionText ?? ""} /></label><label><span>Результат</span><textarea name="result" rows={7} defaultValue={project.result ?? ""} /></label></div>
      <div className="formGrid two"><label><span>Обложка URL</span><input name="coverImageUrl" defaultValue={project.coverImageUrl ?? ""} /></label><label><span>Порядок</span><input type="number" name="sortOrder" defaultValue={project.sortOrder} /></label><label><span>SEO title</span><input name="seoTitle" defaultValue={project.seoTitle ?? ""} /></label><label><span>SEO description</span><input name="seoDescription" defaultValue={project.seoDescription ?? ""} /></label></div>
      <div className="relationGrid"><label><span>Продукция</span><select name="productIds" multiple size={Math.min(Math.max(products.length, 3), 8)} defaultValue={[...selectedProducts]}>{products.map((product) => <option key={product.id} value={product.id}>{product.model} · {product.name}</option>)}</select><small>Ctrl/Cmd — выбрать несколько.</small></label><label><span>Решения</span><select name="solutionIds" multiple size={Math.min(Math.max(solutions.length, 3), 8)} defaultValue={[...selectedSolutions]}>{solutions.map((solution) => <option key={solution.id} value={solution.id}>{solution.name}</option>)}</select><small>Ctrl/Cmd — выбрать несколько.</small></label></div>
      <label className="checkLine"><input type="checkbox" name="featured" defaultChecked={project.featured} /><span>Показывать на главной</span></label>
      <div className="formActions"><button className="primary" type="submit">Сохранить</button><a className="adminButton" href={`/projects/${project.slug}`} target="_blank">Открыть публичную страницу ↗</a></div>
    </form></section><footer>v0.1.0-alpha.4 · Project Editor</footer>
  </main></div>;
}
