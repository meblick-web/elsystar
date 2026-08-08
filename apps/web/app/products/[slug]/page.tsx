import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "../../../lib/products";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Продукт не найден — ELSYSTAR" };
  return {
    title: `${product.name} — ELSYSTAR`,
    description: product.shortDescription,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <main>
      <header className="header shell">
        <a className="logo" href="/">ELSY<span>STAR</span></a>
        <nav><a href="/products">Продукция</a><a href="/#solutions">Решения</a><a href="/#megapolis">ПО</a><a href="/#support">Документация</a><a href="/#company">О компании</a><a href="/#contacts">Контакты</a></nav>
        <div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="/#contacts">Получить КП</a></div>
      </header>

      <section className="productHero shell">
        <div>
          <a className="backLink" href="/products">← Вся продукция</a>
          <p className="eyebrow">{product.model}</p>
          <h1>{product.name}</h1>
          <p className="lead">{product.shortDescription}</p>
          <div className="heroButtons"><a className="button" data-analytics="cta_click" data-product-id={product.id} href="/#contacts">Запросить КП</a>{product.documents.length > 0 && <a className="button ghost" href="#documents">Документация</a>}</div>
        </div>
        <div className="productVisual"><div className="productCabinet"><div className="cabinetLogo">ELSYSTAR</div><div className="vents"></div><div className="handle"></div><small>{product.model}</small></div></div>
      </section>

      <section className="productBody shell">
        <article className="productDescription">
          <p className="eyebrow">ОПИСАНИЕ</p>
          <h2>Назначение и возможности</h2>
          <p>{product.description || product.shortDescription}</p>
        </article>

        <article className="specPanel">
          <p className="eyebrow">ХАРАКТЕРИСТИКИ</p>
          <h2>Основные параметры</h2>
          {product.specifications.length ? <div className="publicSpecList">{product.specifications.map((specification) => <div key={specification.id}><span>{specification.label}</span><strong>{specification.value}{specification.unit ? ` ${specification.unit}` : ""}</strong></div>)}</div> : <p className="mutedText">Характеристики уточняются.</p>}
        </article>
      </section>

      <section id="documents" className="documentsSection shell">
        <div className="sectionHead"><div><p className="eyebrow">ДОКУМЕНТАЦИЯ</p><h2>Материалы по продукту</h2></div></div>
        {product.documents.length ? <div className="documentGrid">{product.documents.map((document) => <a key={document.id} data-analytics="document_download" data-document-id={document.id} href={document.fileUrl} target="_blank" rel="noreferrer"><span>{document.type}</span><strong>{document.title}</strong><small>{document.version ? `Версия ${document.version}` : "Открыть документ"}</small></a>)}</div> : <p className="mutedText">Документы будут опубликованы после переноса технического архива в новый центр документации.</p>}
      </section>

      <section className="support shell"><div><p className="eyebrow">КОНСУЛЬТАЦИЯ</p><h2>Обсудить применение {product.model}</h2><p>Поможем проверить совместимость, подобрать конфигурацию и подготовить коммерческое предложение.</p></div><a className="button" data-analytics="cta_click" data-product-id={product.id} href="/#contacts">Связаться с инженером</a></section>

      <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Продукция</b><a href="/products">Контроллеры</a><a href="/#megapolis">Мегаполис</a></div><div><b>Компания</b><a href="/#company">О компании</a><a href="/#contacts">Контакты</a></div><div><b>Связаться</b><a href="tel:+79674232054">+7 (967) 423-20-54</a><a href="mailto:arkhast@mail.ru">arkhast@mail.ru</a></div></div></footer>
    </main>
  );
}
