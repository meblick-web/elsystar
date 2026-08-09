import type { Metadata } from "next";
import { getCorporateContent, getFaqEntries } from "../../lib/corporate";
import { resolveSeoMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeoMetadata("/faq", { title: "FAQ — ELSYSTAR", description: "Частые вопросы по документации, программному обеспечению, поддержке и коммерческим запросам ELSYSTAR." });
}

export default async function FaqPage() {
  const [content, entries] = await Promise.all([getCorporateContent(), getFaqEntries()]);
  return <main>
    <header className="header shell"><a className="logo" href="/">ELSY<span>STAR</span></a><nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/about">О компании</a><a href="/contacts">Контакты</a></nav><div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="/contacts#request">Получить КП</a></div></header>

    <section className="pageHero shell compactHero"><p className="eyebrow">FAQ</p><h1>Частые вопросы</h1><p className="lead">Документация, ПО, поддержка и коммерческие обращения — основные сценарии собраны в одном месте.</p></section>

    <section className="faqPublic shell">{entries.map((entry, index)=><details key={entry.id} open={index === 0}><summary><span>{String(index + 1).padStart(2,"0")}</span><strong>{entry.question}</strong></summary><p>{entry.answer}</p></details>)}</section>

    <section className="support shell"><div><p className="eyebrow">НЕ НАШЛИ ОТВЕТ?</p><h2>{content.supportTitle}</h2><p>{content.supportBody}</p></div><div className="heroButtons"><a className="button ghost" href="/support">Документация</a><a className="button" href="/contacts">Связаться</a></div></section>

    <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Компания</b><a href="/about">О компании</a><a href="/production">Производство</a><a href="/projects">Проекты</a></div><div><b>Поддержка</b><a href="/support">Документация</a><a href="/faq">FAQ</a></div><div><b>Связаться</b>{content.phonePrimary && <a href={`tel:${content.phonePrimary.replace(/[^+\d]/g,"")}`}>{content.phonePrimary}</a>}{content.emailPrimary && <a href={`mailto:${content.emailPrimary}`}>{content.emailPrimary}</a>}</div></div></footer>
  </main>;
}
