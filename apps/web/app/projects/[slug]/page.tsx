import { notFound } from "next/navigation";
import { getProjectBySlug } from "../../../lib/content";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <main>
      <header className="header shell">
        <a className="logo" href="/">ELSY<span>STAR</span></a>
        <nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a></nav>
        <div className="actions"><a className="button small" data-analytics="cta_click" href="/#contacts">Получить КП</a></div>
      </header>

      <section className="solutionHero shell">
        <a className="backLink" href="/projects">← Все проекты</a>
        <p className="eyebrow">ПРОЕКТ ELSYSTAR</p>
        <h1>{project.title}</h1>
        <p className="lead">{project.summary}</p>
        <div className="projectMeta large">{[project.city, project.region, project.year].filter(Boolean).join(" · ")}</div>
      </section>

      <section className="caseGrid shell">
        {project.challenge && <article><p className="eyebrow">ЗАДАЧА</p><h2>Что требовалось</h2><p>{project.challenge}</p></article>}
        {project.solutionText && <article><p className="eyebrow">РЕШЕНИЕ</p><h2>Что сделали</h2><p>{project.solutionText}</p></article>}
        {project.result && <article><p className="eyebrow">РЕЗУЛЬТАТ</p><h2>Что получили</h2><p>{project.result}</p></article>}
      </section>
    </main>
  );
}
