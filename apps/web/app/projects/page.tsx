import { getPublishedProjects } from "../../lib/content";

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();
  const featured = projects[0];
  const rest = projects.slice(1);

  return (
    <main>
      <header className="header shell">
        <a className="logo" href="/">ELSY<span>STAR</span></a>
        <nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/about">О компании</a><a href="/contacts">Контакты</a></nav>
        <div className="actions"><a className="button small" data-analytics="cta_click" href="/contacts#request">Получить КП</a></div>
      </header>

      <section className="catalogHero shell">
        <p className="eyebrow">ПРОЕКТЫ И ВНЕДРЕНИЯ</p>
        <h1>Реализованные проекты и демонстрационные кейсы</h1>
        <p className="lead">Реальные опубликованные проекты отображаются из CMS. Пока раздел наполняется, демонстрационные кейсы показывают, как будет выглядеть полноценная карточка проекта и какие данные мы планируем раскрывать.</p>
      </section>

      {featured && <section className="projectHeroDense shell">
        <article className="projectFeatured">
          <div className="projectFeaturedMedia">{featured.coverImageUrl && <img src={featured.coverImageUrl} alt={featured.city ? `Транспортная инфраструктура — ${featured.city}` : featured.title} />}<div className="projectFeaturedOverlay">{featured.isDemo && <span className="demoBadge">Демо-кейс</span>}<div className="projectMeta">{[featured.city, featured.region, featured.year].filter(Boolean).join(" · ")}</div><h2>{featured.title}</h2><p>{featured.summary}</p></div></div>
          <div className="projectFeaturedBody">{featured.metrics && <div className="projectMetrics">{featured.metrics.map((metric)=><div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}</div>}<a className="textLink" href={`/projects/${featured.slug}`}>Открыть подробный кейс →</a></div>
        </article>
        <aside className="projectStatsPanel"><p className="eyebrow">РАЗДЕЛ В ЦИФРАХ</p><h3>Что показывает карточка проекта</h3><div className="bigStat"><strong>Задача</strong><span>исходная проблема и ограничения</span></div><div className="bigStat"><strong>Решение</strong><span>оборудование, ПО и архитектура</span></div><div className="bigStat"><strong>KPI</strong><span>измеримый эффект и результат</span></div><div className="bigStat"><strong>Связи</strong><span>продукты и решения ELSYSTAR</span></div></aside>
      </section>}

      <section className="shell section"><div className="sectionHead"><div><p className="eyebrow">КЕЙСЫ</p><h2>Другие проекты</h2></div></div>
        <div className="projectDenseGrid">{rest.map((project)=><article className="projectDenseCard" key={project.id}>{project.coverImageUrl && <img src={project.coverImageUrl} alt={project.city ? `Городская инфраструктура — ${project.city}` : project.title} />}<div className="projectDenseCardBody">{project.isDemo && <span className="demoBadge">Демо-кейс</span>}<div className="projectMeta">{[project.city, project.year].filter(Boolean).join(" · ")}</div><h2>{project.title}</h2><p>{project.summary}</p>{project.metrics && <div className="projectMetrics">{project.metrics.map((metric)=><div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}</div>}<a href={`/projects/${project.slug}`}>Подробнее о проекте →</a></div></article>)}</div>
      </section>

      <section className="support shell"><div><p className="eyebrow">ПРОЕКТ ПОД ВАШУ ЗАДАЧУ</p><h2>Нужно показать похожую архитектуру для вашего города?</h2><p>Опишите количество объектов, текущую инфраструктуру и желаемый уровень автоматизации — подготовим структуру решения и перечень оборудования.</p></div><a className="button" href="/contacts#request">Обсудить проект</a></section>
    </main>
  );
}
