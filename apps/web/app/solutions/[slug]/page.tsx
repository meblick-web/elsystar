import { notFound } from "next/navigation";
import { getSolutionBySlug } from "../../../lib/content";

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = await getSolutionBySlug(slug);
  if (!solution) notFound();

  return (
    <main>
      <header className="header shell">
        <a className="logo" href="/">ELSY<span>STAR</span></a>
        <nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a></nav>
        <div className="actions"><a className="button small" data-analytics="cta_click" href="/#contacts">Получить КП</a></div>
      </header>

      <section className="solutionHero shell">
        <a className="backLink" href="/solutions">← Все решения</a>
        <span className="solutionType">{solution.type === "PLATFORM" ? "ПЛАТФОРМА" : "РЕШЕНИЕ"}</span>
        <h1>{solution.name}</h1>
        <p className="lead">{solution.shortDescription}</p>
      </section>

      <section className="solutionBody shell">
        <article><p className="eyebrow">О РЕШЕНИИ</p><h2>Задача и возможности</h2><p>{solution.description || solution.shortDescription}</p></article>
        <aside><p className="eyebrow">КОНСУЛЬТАЦИЯ</p><h3>Обсудить проект</h3><p>Подберём состав оборудования и архитектуру под объект.</p><a className="button" data-analytics="cta_click" href="/#contacts">Связаться с инженером</a></aside>
      </section>
    </main>
  );
}
