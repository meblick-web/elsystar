import { getPublishedProjects } from "../../lib/content";

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <main>
      <header className="header shell">
        <a className="logo" href="/">ELSY<span>STAR</span></a>
        <nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a></nav>
        <div className="actions"><a className="button small" data-analytics="cta_click" href="/#contacts">Получить КП</a></div>
      </header>

      <section className="catalogHero shell">
        <p className="eyebrow">ПРОЕКТЫ И ВНЕДРЕНИЯ</p>
        <h1>Опыт применения оборудования и систем ELSYSTAR</h1>
        <p className="lead">Здесь собраны внедрения, модернизации и комплексные проекты. Раздел формируется из админ-панели.</p>
      </section>

      <section className="projectGrid shell">
        {projects.length ? projects.map((project) => (
          <article className="projectCard" key={project.id}>
            <div className="projectMeta">{[project.city, project.region, project.year].filter(Boolean).join(" · ") || "Проект ELSYSTAR"}</div>
            <h2>{project.title}</h2>
            <p>{project.summary}</p>
            <a href={`/projects/${project.slug}`}>Открыть проект →</a>
          </article>
        )) : <div className="publicEmpty"><strong>Проекты готовятся к публикации</strong><p>После заполнения раздела в административной панели опубликованные кейсы появятся здесь автоматически.</p></div>}
      </section>
    </main>
  );
}
