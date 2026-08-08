import { getPublishedSolutions } from "../../lib/content";

export default async function SolutionsPage() {
  const solutions = await getPublishedSolutions();

  return (
    <main>
      <header className="header shell">
        <a className="logo" href="/">ELSY<span>STAR</span></a>
        <nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/#contacts">Контакты</a></nav>
        <div className="actions"><a className="button small" data-analytics="cta_click" href="/#contacts">Получить КП</a></div>
      </header>

      <section className="catalogHero shell">
        <p className="eyebrow">РЕШЕНИЯ ELSYSTAR</p>
        <h1>От отдельного перекрёстка до городской системы управления</h1>
        <p className="lead">Подбираем архитектуру под задачу: локальное управление, координация, диспетчеризация, модернизация и интеграция в АСУДТ.</p>
      </section>

      <section className="solutionGrid shell">
        {solutions.map((solution) => (
          <article className="solutionCard" key={solution.id}>
            <span className="solutionType">{solution.type === "PLATFORM" ? "ПЛАТФОРМА" : "РЕШЕНИЕ"}</span>
            <h2>{solution.name}</h2>
            <p>{solution.shortDescription}</p>
            <a href={`/solutions/${solution.slug}`}>Подробнее →</a>
          </article>
        ))}
      </section>
    </main>
  );
}
