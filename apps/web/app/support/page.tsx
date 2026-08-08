import { getPublicDocuments } from "../../lib/documents";

const labels: Record<string, string> = {
  MANUAL: "Руководства",
  CERTIFICATE: "Сертификаты",
  SOFTWARE: "Программное обеспечение",
  FIRMWARE: "Прошивки",
  SCHEME: "Схемы",
  PASSPORT: "Паспорта",
  OTHER: "Другие материалы",
};

export default async function SupportPage() {
  const documents = await getPublicDocuments();
  const groups = documents.reduce<Record<string, typeof documents>>((acc, document) => {
    (acc[document.type] ??= []).push(document);
    return acc;
  }, {});

  return (
    <main>
      <header className="header shell">
        <a className="logo" href="/">ELSY<span>STAR</span></a>
        <nav><a href="/products">Продукция</a><a href="/#solutions">Решения</a><a href="/#megapolis">ПО</a><a href="/support">Документация</a><a href="/#company">О компании</a><a href="/#contacts">Контакты</a></nav>
        <div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="/#request">Получить КП</a></div>
      </header>

      <section className="pageHero shell compactHero">
        <p className="eyebrow">ДОКУМЕНТАЦИЯ И ПОДДЕРЖКА</p>
        <h1>Технические материалы ELSYSTAR</h1>
        <p className="lead">Руководства, сертификаты, программное обеспечение, прошивки, схемы и паспорта оборудования в одном месте.</p>
      </section>

      <section className="supportLibrary shell">
        {documents.length ? Object.entries(groups).map(([type, items]) => (
          <section className="supportGroup" key={type}>
            <div className="sectionHead"><div><p className="eyebrow">{type}</p><h2>{labels[type] ?? "Материалы"}</h2></div><span>{items.length}</span></div>
            <div className="documentList">
              {items.map((document) => (
                <a key={document.id} data-analytics="document_download" data-document-id={document.id} href={document.fileUrl} target="_blank" rel="noreferrer">
                  <div><strong>{document.title}</strong><p>{document.description || document.fileName}</p></div>
                  <div className="documentMeta">{document.product ? <span>{document.product.model}</span> : null}{document.version ? <span>v{document.version}</span> : null}<span>{document.language.toUpperCase()}</span><b>Открыть ↗</b></div>
                </a>
              ))}
            </div>
          </section>
        )) : (
          <div className="emptyLibrary"><h2>Центр документации готов</h2><p>После добавления материалов через административную панель они автоматически появятся здесь. До подключения PostgreSQL публичная страница остаётся пустой и не показывает тестовые файлы.</p><a className="button" href="/#request">Запросить документ</a></div>
        )}
      </section>

      <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Продукция</b><a href="/products">Контроллеры</a><a href="/#megapolis">Мегаполис</a></div><div><b>Поддержка</b><a href="/support">Документация</a><a href="/#request">Связаться с инженером</a></div><div><b>Связаться</b><a href="tel:+79674232054">+7 (967) 423-20-54</a><a href="mailto:arkhast@mail.ru">arkhast@mail.ru</a></div></div></footer>
    </main>
  );
}
