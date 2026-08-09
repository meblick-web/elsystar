import type { Metadata } from "next";
import { LeadForm } from "../../components/lead-form";
import { getCorporateContent } from "../../lib/corporate";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/contacts", { title: "Контакты — ELSYSTAR", description: "Контакты ELSYSTAR для коммерческих запросов, технической поддержки и вопросов по оборудованию." });
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export default async function ContactsPage() {
  const content = await getCorporateContent();
  const media = content.media.filter((item) => item.section === "CONTACTS");
  const hasRequisites = Boolean(content.inn || content.kpp || content.ogrn);
  return <main>
    <header className="header shell"><a className="logo" href="/">ELSY<span>STAR</span></a><nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/about">О компании</a><a href="/contacts">Контакты</a></nav><div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="#request">Получить КП</a></div></header>

    <section className="pageHero shell compactHero"><p className="eyebrow">КОНТАКТЫ</p><h1>Связаться с ELSYSTAR</h1><p className="lead">Коммерческие запросы, техническая поддержка, документация и вопросы по оборудованию.</p></section>

    <section className="contactGrid shell"><article className="contactPrimary"><p className="eyebrow">СВЯЗАТЬСЯ</p><h2>{content.companyName}</h2>{content.phonePrimary && <a data-analytics="phone_click" href={phoneHref(content.phonePrimary)}><span>Основной телефон</span><strong>{content.phonePrimary}</strong></a>}{content.phoneSecondary && <a data-analytics="phone_click" href={phoneHref(content.phoneSecondary)}><span>Дополнительный телефон</span><strong>{content.phoneSecondary}</strong></a>}{content.emailPrimary && <a data-analytics="email_click" href={`mailto:${content.emailPrimary}`}><span>E-mail</span><strong>{content.emailPrimary}</strong></a>}</article>
      <article className="contactDetails"><p className="eyebrow">ИНФОРМАЦИЯ</p>{content.address && <div><span>Адрес</span><strong>{content.address}</strong></div>}{content.workingHours && <div><span>Режим работы</span><strong>{content.workingHours}</strong></div>}<div><span>Техническая поддержка</span><strong><a href="/support">Документация и ПО →</a></strong></div><div><span>Частые вопросы</span><strong><a href="/faq">FAQ →</a></strong></div>{!content.address && !content.workingHours && <p className="mutedText">Адрес и режим работы будут опубликованы после подтверждения корпоративных данных.</p>}</article>
    </section>

    {media.length > 0 && <section className="corporateGallery shell">{media.map((item)=><figure key={item.id}><img src={item.url} alt={item.alt ?? item.title} /><figcaption>{item.caption || item.title}</figcaption></figure>)}</section>}

    {hasRequisites && <section className="companyRequisites shell"><div><p className="eyebrow">РЕКВИЗИТЫ</p><h2>{content.legalName || content.companyName}</h2></div><dl>{content.inn && <><dt>ИНН</dt><dd>{content.inn}</dd></>}{content.kpp && <><dt>КПП</dt><dd>{content.kpp}</dd></>}{content.ogrn && <><dt>ОГРН</dt><dd>{content.ogrn}</dd></>}</dl></section>}

    <section id="request" className="requestSection shell"><div className="requestIntro"><p className="eyebrow">КОММЕРЧЕСКИЙ ЗАПРОС</p><h2>Получить коммерческое предложение</h2><p>Опишите объект, оборудование или задачу. Заявка будет сохранена в административной панели вместе с источником перехода.</p></div><LeadForm /></section>

    <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Компания</b><a href="/about">О компании</a><a href="/production">Производство</a><a href="/projects">Проекты</a></div><div><b>Поддержка</b><a href="/support">Документация</a><a href="/faq">FAQ</a></div><div><b>Связаться</b>{content.phonePrimary && <a href={phoneHref(content.phonePrimary)}>{content.phonePrimary}</a>}{content.emailPrimary && <a href={`mailto:${content.emailPrimary}`}>{content.emailPrimary}</a>}</div></div></footer>
  </main>;
}
