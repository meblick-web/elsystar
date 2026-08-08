import { ContentStatus, prisma, SolutionType } from "@elsystar/database";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { logout } from "../../login/actions";
import { updateSolution } from "../actions";

export default async function SolutionEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  if (!prisma) notFound();
  const solution = await prisma.solution.findUnique({ where: { id } });
  if (!solution) notFound();
  const action = updateSolution.bind(null, id);

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a className="active" href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a></nav></aside><main>
    <header><div><span>Решение</span><h1>{solution.name}</h1></div><div className="headerActions"><a className="adminButton" href="/solutions">← Список</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {query.saved && <div className="adminSuccess">Изменения сохранены.</div>}
    {query.error && <div className="adminError">Проверьте обязательные поля.</div>}
    <section className="contentCard formCard"><form action={action} className="adminForm">
      <div className="formGrid two"><label><span>Название *</span><input name="name" defaultValue={solution.name} required /></label><label><span>URL</span><input name="slug" defaultValue={solution.slug} /></label><label><span>Тип</span><select name="type" defaultValue={solution.type}><option value={SolutionType.SOLUTION}>Решение</option><option value={SolutionType.PLATFORM}>Платформа</option></select></label><label><span>Статус</span><select name="status" defaultValue={solution.status}><option value={ContentStatus.DRAFT}>Черновик</option><option value={ContentStatus.PUBLISHED}>Опубликовано</option><option value={ContentStatus.ARCHIVED}>Архив</option></select></label></div>
      <label><span>Краткое описание *</span><textarea name="shortDescription" rows={3} defaultValue={solution.shortDescription} required /></label>
      <label><span>Полное описание</span><textarea name="description" rows={8} defaultValue={solution.description ?? ""} /></label>
      <div className="formGrid two"><label><span>Изображение URL</span><input name="imageUrl" defaultValue={solution.imageUrl ?? ""} /></label><label><span>Порядок</span><input type="number" name="sortOrder" defaultValue={solution.sortOrder} /></label><label><span>SEO title</span><input name="seoTitle" defaultValue={solution.seoTitle ?? ""} /></label><label><span>SEO description</span><input name="seoDescription" defaultValue={solution.seoDescription ?? ""} /></label></div>
      <label className="checkLine"><input type="checkbox" name="featured" defaultChecked={solution.featured} /><span>Показывать на главной</span></label>
      <div className="formActions"><button className="primary" type="submit">Сохранить</button><a className="adminButton" href={`/solutions/${solution.slug}`} target="_blank">Открыть публичную страницу ↗</a></div>
    </form></section><footer>v0.1.0-alpha.4 · Solution Editor</footer>
  </main></div>;
}
