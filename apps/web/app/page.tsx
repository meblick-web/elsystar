import { LeadForm } from "../components/lead-form";
import { getFeaturedProducts } from "../lib/products";
import { getHomepageContent, getPublishedProjects, getPublishedSolutions } from "../lib/content";
import { getCorporateContent } from "../lib/corporate";

export default async function Home() {
  const [products, content, solutions, projects, corporate] = await Promise.all([
    getFeaturedProducts(),
    getHomepageContent(),
    getPublishedSolutions(true),
    getPublishedProjects(true),
    getCorporateContent(),
  ]);
  const platform = solutions.find((solution) => solution.type === "PLATFORM");

  return (
    <main>
      <header className="header shell">
        <a className="logo" href="/">ELSY<span>STAR</span></a>
        <nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/about">О компании</a><a href="/contacts">Контакты</a></nav>
        <div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="#request">Получить КП</a></div>
      </header>

      <section className="hero shell">
        <div className="heroCopy">
          <p className="eyebrow">{content.heroEyebrow}</p>
          <h1>{content.heroTitle}</h1>
          <p className="lead">{content.heroDescription}</p>
          <div className="heroButtons"><a className="button" data-analytics="cta_click" href={content.primaryCtaHref}>{content.primaryCtaLabel}</a><a className="button ghost" href={content.secondaryCtaHref}>{content.secondaryCtaLabel}</a></div>
        </div>
        <div className="heroVisual" aria-label="Концептуальная визуализация контроллера">
          <div className="signal"><i></i><i></i><i className="active"></i></div>
          <div className="cabinet"><div className="cabinetLogo">ELSYSTAR</div><div className="vents"></div><div className="handle"></div><small>УК-4.1М</small></div>
          <div className="dashboard"><b>Мегаполис</b><span>Состояние сети</span><strong>● Нормально</strong><div className="chart"></div></div>
        </div>
      </section>

      <section className="trust shell"><div><strong>30+</strong><span>лет инженерного опыта</span></div><div><strong>Собственное</strong><span>производство оборудования</span></div><div><strong>Комплексно</strong><span>от контроллера до АСУДТ</span></div></section>

      <section className="companyTeaser shell"><div><p className="eyebrow">{corporate.aboutEyebrow}</p><h2>{corporate.aboutTitle}</h2><p>{corporate.aboutLead}</p></div><div className="companyTeaserActions"><a className="textLink" href="/about">О компании →</a><a className="textLink" href="/production">Производство →</a></div></section>

      <section id="solutions" className="section shell">
        <div className="sectionHead"><div><p className="eyebrow">{content.solutionsEyebrow}</p><h2>{content.solutionsTitle}</h2></div><a href="/solutions">Все решения →</a></div>
        <div className="threeCards">{solutions.slice(0, 3).map((solution, index) => <article key={solution.id}><div className="icon">{index === 0 ? "◇" : index === 1 ? "⌁" : "↗"}</div><h3>{solution.name}</h3><p>{solution.shortDescription}</p><a href={`/solutions/${solution.slug}`}>Подробнее →</a></article>)}</div>
      </section>

      {platform && <section id="megapolis" className="megapolis shell">
        <div><p className="eyebrow">ПЛАТФОРМА</p><h2>{platform.name}</h2><p>{platform.shortDescription}</p><a className="textLink" href={`/solutions/${platform.slug}`}>О системе →</a></div>
        <div className="map"><span className="road r1"></span><span className="road r2"></span><span className="road r3"></span><i></i><i></i><i></i></div>
      </section>}

      <section id="products" className="section shell">
        <div className="sectionHead"><div><p className="eyebrow">ПРОДУКЦИЯ</p><h2>Основные контроллеры</h2></div><a href="/products">Вся продукция →</a></div>
        <div className="productGrid">{products.map((product) => <article key={product.id}><div className="miniCabinet"></div><div><h3>{product.model}</h3><p>{product.shortDescription}</p><a data-analytics="product_view" data-product-id={product.id} href={`/products/${product.slug}`}>Подробнее →</a></div></article>)}</div>
      </section>

      {projects.length > 0 && <section className="section shell homeProjects">
        <div className="sectionHead"><div><p className="eyebrow">{content.projectsEyebrow}</p><h2>{content.projectsTitle}</h2></div><a href="/projects">Все проекты →</a></div>
        <div className="homeProjectGrid">{projects.slice(0, 3).map((project) => <article key={project.id}><span>{[project.city, project.year].filter(Boolean).join(" · ") || "Проект ELSYSTAR"}</span><h3>{project.title}</h3><p>{project.summary}</p><a href={`/projects/${project.slug}`}>Подробнее →</a></article>)}</div>
      </section>}

      <section id="support" className="support shell"><div><p className="eyebrow">ПОДДЕРЖКА</p><h2>{content.supportTitle}</h2><p>{content.supportDescription}</p></div><div className="heroButtons"><a className="button ghost" data-analytics="cta_click" href="/support">Документация</a><a className="button ghost" href="/faq">FAQ</a></div></section>

      <section id="request" className="requestSection shell">
        <div className="requestIntro"><p className="eyebrow">СВЯЗАТЬСЯ С НАМИ</p><h2>Получить коммерческое предложение</h2><p>Оставьте задачу и контакты. Обращение попадёт в панель управления вместе с источником перехода и страницей, с которой оно было отправлено.</p></div>
        <LeadForm />
      </section>

      <footer id="contacts" className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Продукция</b><a href="/products">Контроллеры</a><a href="/solutions">Решения</a><a href="/support">Документация</a></div><div><b>Компания</b><a href="/about">О компании</a><a href="/production">Производство</a><a href="/projects">Проекты</a><a href="/contacts">Контакты</a></div><div><b>Связаться</b>{corporate.phonePrimary && <a href={`tel:${corporate.phonePrimary.replace(/[^+\d]/g,"")}`}>{corporate.phonePrimary}</a>}{corporate.emailPrimary && <a href={`mailto:${corporate.emailPrimary}`}>{corporate.emailPrimary}</a>}</div></div></footer>
    </main>
  );
}
