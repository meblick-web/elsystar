import type { Metadata } from "next";
import { getCorporateContent } from "../../lib/corporate";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/about", { title: "О компании — ELSYSTAR", description: "ELSYSTAR: разработка и производство дорожных контроллеров, АСУДД и программного обеспечения управления движением." });
}

export default async function AboutPage() {
  const content = await getCorporateContent();
  const media = content.media.filter((item) => item.section === "ABOUT");
  return <main>
    <header className="header shell"><a className="logo" href="/">ELSY<span>STAR</span></a><nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/about">О компании</a><a href="/contacts">Контакты</a></nav><div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="/contacts#request">Получить КП</a></div></header>

    <section className="corporateHero shell"><div><p className="eyebrow">{content.aboutEyebrow}</p><h1>{content.aboutTitle}</h1><p className="lead">{content.aboutLead}</p></div>{media[0] ? <img src={media[0].url} alt={media[0].alt ?? media[0].title} /> : <div className="corporatePattern"><span>ELSYSTAR</span><small>Инженерные решения для ИТС и АСУДД</small></div>}</section>

    <section className="corporateTextGrid shell"><article><p className="eyebrow">КОМПАНИЯ</p><h2>{content.companyName}</h2><p>{content.aboutBody}</p></article><article><p className="eyebrow">ОПЫТ</p><h2>{content.historyTitle}</h2><p>{content.historyBody}</p></article></section>

    <section className="section shell"><div className="sectionHead"><div><p className="eyebrow">КОМПЕТЕНЦИИ</p><h2>{content.competenciesTitle}</h2></div><a href="/production">О производстве →</a></div><div className="corporateCompetencies">{content.competencies.map((item)=><article key={item.id}><span>+</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></section>

    {media.length > 1 && <section className="corporateGallery shell">{media.slice(1).map((item)=><figure key={item.id}><img src={item.url} alt={item.alt ?? item.title} /><figcaption>{item.caption || item.title}</figcaption></figure>)}</section>}

    <section className="support shell"><div><p className="eyebrow">СЛЕДУЮЩИЙ ШАГ</p><h2>Оборудование и решения ELSYSTAR</h2><p>Перейдите к производству, каталогу контроллеров или свяжитесь с нами по задаче конкретного объекта.</p></div><div className="heroButtons"><a className="button ghost" href="/production">Производство</a><a className="button" href="/contacts">Контакты</a></div></section>

    <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Компания</b><a href="/about">О компании</a><a href="/production">Производство</a><a href="/projects">Проекты</a></div><div><b>Поддержка</b><a href="/support">Документация</a><a href="/faq">FAQ</a></div><div><b>Связаться</b>{content.phonePrimary && <a href={`tel:${content.phonePrimary.replace(/[^+\d]/g,"")}`}>{content.phonePrimary}</a>}{content.emailPrimary && <a href={`mailto:${content.emailPrimary}`}>{content.emailPrimary}</a>}</div></div></footer>
  </main>;
}
