import { DocumentType } from "@elsystar/database";
import { getCorporateContent, getFaqEntries } from "../../lib/corporate";
import { getSupportLibrary } from "../../lib/documents";

const labels: Record<string, string> = {
  MANUAL: "Руководства",
  CERTIFICATE: "Сертификаты",
  SOFTWARE: "Программное обеспечение",
  FIRMWARE: "Прошивки",
  SCHEME: "Схемы",
  PASSPORT: "Паспорта",
  OTHER: "Другие материалы",
};

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; product?: string; language?: string }> }) {
  const query = await searchParams;
  const [library, corporate, faqs] = await Promise.all([
    getSupportLibrary({ q: query.q, type: query.type, productId: query.product, language: query.language }),
    getCorporateContent(),
    getFaqEntries(),
  ]);

  return <main>
    <header className="header shell"><a className="logo" href="/">ELSY<span>STAR</span></a><nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/about">О компании</a><a href="/contacts">Контакты</a></nav><div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="/contacts#request">Получить КП</a></div></header>

    <section className="pageHero shell compactHero"><p className="eyebrow">ДОКУМЕНТАЦИЯ И ПОДДЕРЖКА</p><h1>{corporate.supportTitle}</h1><p className="lead">{corporate.supportBody}</p></section>

    <section className="supportFilters shell"><form><input name="q" defaultValue={query.q ?? ""} placeholder="Поиск по названию, продукту или описанию" /><select name="type" defaultValue={query.type ?? ""}><option value="">Все типы</option>{Object.values(DocumentType).map((type)=><option key={type} value={type}>{labels[type]}</option>)}</select><select name="product" defaultValue={query.product ?? ""}><option value="">Все продукты</option>{library.products.map((product)=><option key={product.id} value={product.id}>{product.model}</option>)}</select><select name="language" defaultValue={query.language ?? ""}><option value="">Все языки</option>{library.languages.map((language)=><option key={language} value={language}>{language.toUpperCase()}</option>)}</select><button className="button small" type="submit">Найти</button><a href="/support">Сбросить</a></form></section>

    <section className="supportLibrary shell">
      {library.series.length > 0 && <div className="supportSeriesGrid">{library.series.map((series)=>{const current=series.currentVersion;return <article key={series.id} className="supportSeriesCard"><div className="supportSeriesTop"><span>{labels[series.type] ?? series.type}</span><span>{series.language.toUpperCase()}</span></div><h2>{series.title}</h2><p>{series.description || current?.description || "Технический материал ELSYSTAR."}</p><div className="supportSeriesMeta">{series.product && <a href={`/products/${series.product.slug}`}>{series.product.model}</a>}{current?.version && <strong>v{current.version}</strong>}{current?.releaseDate && <span>{current.releaseDate.toLocaleDateString("ru-RU")}</span>}{current?.fileSize && <span>{formatSize(current.fileSize)}</span>}</div><div className="supportSeriesActions">{current && <a className="button small" data-analytics="document_download" data-document-id={current.id} href={current.fileUrl} target="_blank" rel="noreferrer">Скачать актуальную</a>}<a href={`/support/${series.slug}`}>История версий →</a></div>{series.versions.length > 1 && <small className="archiveHint">В архиве ещё {series.versions.length - 1} вер.</small>}</article>;})}</div>}

      {library.legacy.length > 0 && <section className="supportGroup legacySupport"><div className="sectionHead"><div><p className="eyebrow">АРХИВ ПРЕДЫДУЩЕЙ СТРУКТУРЫ</p><h2>Одиночные материалы</h2></div><span>{library.legacy.length}</span></div><div className="documentList">{library.legacy.map((document)=><a key={document.id} data-analytics="document_download" data-document-id={document.id} href={document.fileUrl} target="_blank" rel="noreferrer"><div><strong>{document.title}</strong><p>{document.description || document.fileName}</p></div><div className="documentMeta">{document.version && <span>v{document.version}</span>}<span>{document.language.toUpperCase()}</span><b>Открыть ↗</b></div></a>)}</div></section>}

      {!library.series.length && !library.legacy.length && <div className="emptyLibrary"><h2>По выбранным условиям материалов нет</h2><p>Измените фильтры или отправьте запрос инженеру — нужный документ можно добавить в центр поддержки.</p><a className="button" href="/contacts#request">Запросить документ</a></div>}
    </section>

    <section className="supportContact shell"><div><p className="eyebrow">ТЕХНИЧЕСКАЯ ПОДДЕРЖКА</p><h2>Нужен материал или помощь инженера?</h2><p>Если нужного документа или версии ПО нет в открытом центре, свяжитесь с ELSYSTAR.</p></div><div>{corporate.phonePrimary && <a data-analytics="phone_click" href={`tel:${corporate.phonePrimary.replace(/[^+\d]/g,"")}`}><span>Телефон</span><strong>{corporate.phonePrimary}</strong></a>}{corporate.emailPrimary && <a data-analytics="email_click" href={`mailto:${corporate.emailPrimary}`}><span>E-mail</span><strong>{corporate.emailPrimary}</strong></a>}</div></section>

    <section className="section shell faqPreview"><div className="sectionHead"><div><p className="eyebrow">FAQ</p><h2>Частые вопросы</h2></div><a href="/faq">Все вопросы →</a></div><div className="faqPreviewGrid">{faqs.slice(0,3).map((entry)=><article key={entry.id}><h3>{entry.question}</h3><p>{entry.answer}</p></article>)}</div></section>

    <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Продукция</b><a href="/products">Каталог</a><a href="/solutions">Решения</a></div><div><b>Компания</b><a href="/about">О компании</a><a href="/production">Производство</a><a href="/projects">Проекты</a></div><div><b>Поддержка</b><a href="/support">Документация</a><a href="/faq">FAQ</a><a href="/contacts">Контакты</a></div></div></footer>
  </main>;
}
