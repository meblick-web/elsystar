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
        <nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/about">О компании</a><a href="/contacts">Контакты</a></nav>
        <div className="actions"><a className="button small" data-analytics="cta_click" href="/contacts#request">Получить КП</a></div>
      </header>

      {project.coverImageUrl ? <section className="caseHeroMedia shell"><img src={project.coverImageUrl} alt={project.city ? `Транспортная инфраструктура — ${project.city}` : project.title} /><div className="caseHeroContent"><a className="backLink" href="/projects">← Все проекты</a>{project.isDemo && <span className="demoBadge">Демонстрационный проект</span>}<p className="eyebrow">{[project.city, project.region, project.year].filter(Boolean).join(" · ") || "ПРОЕКТ ELSYSTAR"}</p><h1>{project.title}</h1><p className="lead">{project.summary}</p>{project.metrics && <div className="projectMetrics">{project.metrics.map((metric)=><div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}</div>}</div></section> : <section className="solutionHero shell"><a className="backLink" href="/projects">← Все проекты</a><p className="eyebrow">ПРОЕКТ ELSYSTAR</p><h1>{project.title}</h1><p className="lead">{project.summary}</p></section>}

      {project.isDemo && <section className="shell demoDisclosure"><strong>Демонстрационный кейс</strong><span>Цифры и результаты на этой странице используются для демонстрации структуры будущих кейсов и не являются заявлением о фактическом внедрении ELSYSTAR.</span></section>}

      <section className="caseGrid shell">
        {project.challenge && <article><p className="eyebrow">ЗАДАЧА</p><h2>Что требовалось</h2><p>{project.challenge}</p></article>}
        {project.solutionText && <article><p className="eyebrow">РЕШЕНИЕ</p><h2>Что сделали</h2><p>{project.solutionText}</p></article>}
        {project.result && <article><p className="eyebrow">РЕЗУЛЬТАТ</p><h2>Что получили</h2><p>{project.result}</p></article>}
      </section>

      <section className="support shell"><div><p className="eyebrow">ПОХОЖАЯ ЗАДАЧА</p><h2>Подготовить архитектуру и состав оборудования?</h2><p>Для реального проекта показатели рассчитываются только после обследования объекта и подтверждения исходных данных.</p></div><a className="button" href="/contacts#request">Обсудить проект</a></section>
    </main>
  );
}
