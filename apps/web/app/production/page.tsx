import type { Metadata } from "next";
import { getCorporateContent } from "../../lib/corporate";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/production", { title: "Производство — ELSYSTAR", description: "Собственное производство дорожных контроллеров, модулей сопряжения и оборудования АСУДД ELSYSTAR." });
}

export default async function ProductionPage() {
  const content = await getCorporateContent();
  const media = content.media.filter((item) => item.section === "PRODUCTION");
  return <main>
    <header className="header shell"><a className="logo" href="/">ELSY<span>STAR</span></a><nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/about">О компании</a><a href="/contacts">Контакты</a></nav><div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="/contacts#request">Получить КП</a></div></header>

    <section className="corporateHero shell"><div><p className="eyebrow">{content.productionEyebrow}</p><h1>{content.productionTitle}</h1><p className="lead">{content.productionLead}</p></div>{media[0] ? <img src={media[0].url} alt={media[0].alt ?? media[0].title} /> : <div className="corporatePattern productionPattern"><span>CONTROL</span><small>Контроллеры · модули · подсистемы АСУДД</small></div>}</section>

    <section className="corporateTextGrid shell productionIntro"><article><p className="eyebrow">ВОЗМОЖНОСТИ</p><h2>От компонентов до комплексных решений</h2><p>{content.productionBody}</p></article><article className="productionFacts"><div><strong>Контроллеры</strong><span>собственная линейка оборудования</span></div><div><strong>Модули</strong><span>сопряжение и сбор информации</span></div><div><strong>АСУДД</strong><span>компоненты, подсистемы и решения</span></div></article></section>

    <section className="section shell"><div className="sectionHead"><div><p className="eyebrow">КОМПЕТЕНЦИИ</p><h2>{content.competenciesTitle}</h2></div><a href="/products">Каталог продукции →</a></div><div className="corporateCompetencies">{content.competencies.map((item)=><article key={item.id}><span>+</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></section>

    {media.length > 1 && <section className="corporateGallery shell">{media.slice(1).map((item)=><figure key={item.id}><img src={item.url} alt={item.alt ?? item.title} /><figcaption>{item.caption || item.title}</figcaption></figure>)}</section>}

    <section className="support shell"><div><p className="eyebrow">ПОДБОР ОБОРУДОВАНИЯ</p><h2>Нужна конфигурация под конкретный объект?</h2><p>Опишите задачу, количество направлений, требования к связи и интеграции — запрос можно привязать к продукции и решению.</p></div><a className="button" data-analytics="cta_click" href="/contacts#request">Обсудить задачу</a></section>

    <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Компания</b><a href="/about">О компании</a><a href="/production">Производство</a><a href="/projects">Проекты</a></div><div><b>Поддержка</b><a href="/support">Документация</a><a href="/faq">FAQ</a></div><div><b>Связаться</b>{content.phonePrimary && <a href={`tel:${content.phonePrimary.replace(/[^+\d]/g,"")}`}>{content.phonePrimary}</a>}{content.emailPrimary && <a href={`mailto:${content.emailPrimary}`}>{content.emailPrimary}</a>}</div></div></footer>
  </main>;
}
