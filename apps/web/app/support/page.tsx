import { DocumentType } from "@elsystar/database";
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
  const library = await getSupportLibrary({ q: query.q, type: query.type, productId: query.product, language: query.language });

  return <main>
    <header className="header shell"><a className="logo" href="/">ELSY<span>STAR</span></a><nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/#contacts">Контакты</a></nav><div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="/#request">Получить КП</a></div></header>

    <section className="pageHero shell compactHero"><p className="eyebrow">ДОКУМЕНТАЦИЯ И ПОДДЕРЖКА</p><h1>Технические материалы ELSYSTAR</h1><p className="lead">Актуальные руководства, сертификаты, ПО и прошивки с историей версий и архивом предыдущих релизов.</p></section>

    <section className="supportFilters shell"><form><input name="q" defaultValue={query.q ?? ""} placeholder="Поиск по названию, продукту или описанию" /><select name="type" defaultValue={query.type ?? ""}><option value="">Все типы</option>{Object.values(DocumentType).map((type)=><option key={type} value={type}>{labels[type]}</option>)}</select><select name="product" defaultValue={query.product ?? ""}><option value="">Все продукты</option>{library.products.map((product)=><option key={product.id} value={product.id}>{product.model}</option>)}</select><select name="language" defaultValue={query.language ?? ""}><option value="">Все языки</option>{library.languages.map((language)=><option key={language} value={language}>{language.toUpperCase()}</option>)}</select><button className="button small" type="submit">Найти</button><a href="/support">Сбросить</a></form></section>

    <section className="supportLibrary shell">
      {library.series.length > 0 && <div className="supportSeriesGrid">{library.series.map((series)=>{const current=series.currentVersion;return <article key={series.id} className="supportSeriesCard"><div className="supportSeriesTop"><span>{labels[series.type] ?? series.type}</span><span>{series.language.toUpperCase()}</span></div><h2>{series.title}</h2><p>{series.description || current?.description || "Технический материал ELSYSTAR."}</p><div className="supportSeriesMeta">{series.product && <a href={`/products/${series.product.slug}`}>{series.product.model}</a>}{current?.version && <strong>v{current.version}</strong>}{current?.releaseDate && <span>{current.releaseDate.toLocaleDateString("ru-RU")}</span>}{current?.fileSize && <span>{formatSize(current.fileSize)}</span>}</div><div className="supportSeriesActions">{current && <a className="button small" data-analytics="document_download" data-document-id={current.id} href={current.fileUrl} target="_blank" rel="noreferrer">Скачать актуальную</a>}<a href={`/support/${series.slug}`}>История версий →</a></div>{series.versions.length > 1 && <small className="archiveHint">В архиве ещё {series.versions.length - 1} вер.</small>}</article>;})}</div>}

      {library.legacy.length > 0 && <section className="supportGroup legacySupport"><div className="sectionHead"><div><p className="eyebrow">АРХИВ ПРЕДЫДУЩЕЙ СТРУКТУРЫ</p><h2>Одиночные материалы</h2></div><span>{library.legacy.length}</span></div><div className="documentList">{library.legacy.map((document)=><a key={document.id} data-analytics="document_download" data-document-id={document.id} href={document.fileUrl} target="_blank" rel="noreferrer"><div><strong>{document.title}</strong><p>{document.description || document.fileName}</p></div><div className="documentMeta">{document.version && <span>v{document.version}</span>}<span>{document.language.toUpperCase()}</span><b>Открыть ↗</b></div></a>)}</div></section>}

      {!library.series.length && !library.legacy.length && <div className="emptyLibrary"><h2>По выбранным условиям материалов нет</h2><p>Измените фильтры или отправьте запрос инженеру — нужный документ можно добавить в центр поддержки.</p><a className="button" href="/#request">Запросить документ</a></div>}
    </section>

    <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Продукция</b><a href="/products">Каталог</a><a href="/solutions">Решения</a></div><div><b>Поддержка</b><a href="/support">Документация</a><a href="/#request">Связаться с инженером</a></div><div><b>Компания</b><a href="/projects">Проекты</a><a href="/#contacts">Контакты</a></div></div></footer>
  </main>;
}
