import { getPublishedSolutions } from "../../lib/content";

export default async function SolutionsPage() {
  const solutions = await getPublishedSolutions();

  return (
    <main>
      <header className="header shell">
        <a className="logo" href="/">ELSY<span>STAR</span></a>
        <nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/about">О компании</a><a href="/contacts">Контакты</a></nav>
        <div className="actions"><a className="button small" data-analytics="cta_click" href="/contacts#request">Получить КП</a></div>
      </header>

      <section className="catalogHero shell">
        <p className="eyebrow">РЕШЕНИЯ ELSYSTAR</p>
        <h1>От отдельного перекрёстка до городской системы управления</h1>
        <p className="lead">Подбираем архитектуру под задачу: локальное управление, координация, диспетчеризация, модернизация и интеграция в АСУДТ.</p>
      </section>

      <section className="solutionGrid shell">
        {solutions.map((solution) => (
          <article className="solutionCard" key={solution.id}>
            {solution.imageUrl && <img src={solution.imageUrl} alt={solution.name} />}
            <span className="solutionType">{solution.type === "PLATFORM" ? "ПЛАТФОРМА" : "РЕШЕНИЕ"}</span>
            <h2>{solution.name}</h2>
            <p>{solution.shortDescription}</p>
            <a href={`/solutions/${solution.slug}`}>Подробнее →</a>
          </article>
        ))}
      </section>

      <section className="support shell"><div><p className="eyebrow">ПОДБОР АРХИТЕКТУРЫ</p><h2>Не знаете, с какого решения начать?</h2><p>Опишите объект, существующее оборудование и задачу — предложим состав системы и порядок внедрения.</p></div><a className="button" href="/contacts#request">Обсудить решение</a></section>
    </main>
  );
}
