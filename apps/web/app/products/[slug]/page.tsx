import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeadForm } from "../../../components/lead-form";
import { getProductBySlug } from "../../../lib/products";

const relationLabels: Record<string, string> = {
  COMPATIBLE: "Совместимое оборудование",
  ACCESSORY: "Комплектующие",
  ALTERNATIVE: "Альтернативные модели",
  RELATED: "Связанные товары",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Продукт не найден — ELSYSTAR" };
  return { title: product.seoTitle || `${product.name} — ELSYSTAR`, description: product.seoDescription || product.shortDescription };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const primaryImage = product.mediaAssets.find((item) => item.isPrimary) ?? product.mediaAssets[0];

  return <main>
    <header className="header shell"><a className="logo" href="/">ELSY<span>STAR</span></a><nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/#contacts">Контакты</a></nav><div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" data-product-id={product.id} href="#request">Получить КП</a></div></header>

    <section className="productHero shell"><div><a className="backLink" href={product.category ? `/products?category=${encodeURIComponent(product.category.slug)}` : "/products"}>← {product.category?.name ?? "Вся продукция"}</a><p className="eyebrow">{product.model}</p><h1>{product.name}</h1><p className="lead">{product.shortDescription}</p><div className="heroButtons"><a className="button" data-analytics="cta_click" data-product-id={product.id} href="#request">Запросить КП</a>{product.documents.length > 0 && <a className="button ghost" href="#documents">Документация</a>}</div></div>
      <div className="productVisual productMediaHero">{primaryImage ? <img src={primaryImage.url} alt={primaryImage.alt ?? product.name} /> : <div className="productCabinet"><div className="cabinetLogo">ELSYSTAR</div><div className="vents"></div><div className="handle"></div><small>{product.model}</small></div>}</div>
    </section>

    {product.mediaAssets.length > 1 && <section className="productGallery shell">{product.mediaAssets.map((asset)=><figure key={asset.id}><img src={asset.url} alt={asset.alt ?? asset.title} /><figcaption>{asset.title}</figcaption></figure>)}</section>}

    <section className="productBody shell"><article className="productDescription"><p className="eyebrow">ОПИСАНИЕ</p><h2>Назначение и возможности</h2><p>{product.description || product.shortDescription}</p></article><article className="specPanel"><p className="eyebrow">ХАРАКТЕРИСТИКИ</p><h2>Основные параметры</h2>{product.specifications.length ? <div className="publicSpecList">{product.specifications.map((specification)=><div key={specification.id}><span>{specification.label}</span><strong>{specification.value}{specification.unit ? ` ${specification.unit}` : ""}</strong></div>)}</div> : <p className="mutedText">Характеристики уточняются.</p>}</article></section>

    {product.features.length > 0 && <section className="section shell productFeatures"><div className="sectionHead"><div><p className="eyebrow">ПРЕИМУЩЕСТВА</p><h2>Ключевые возможности</h2></div></div><div className="threeCards">{product.features.map((feature)=><article key={feature.id}><div className="icon">✓</div><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</div></section>}

    {product.configurations.length > 0 && <section className="section shell"><div className="sectionHead"><div><p className="eyebrow">КОМПЛЕКТАЦИИ</p><h2>Варианты исполнения</h2></div></div><div className="configurationGrid">{product.configurations.map((configuration)=><article key={configuration.id}><span>{configuration.sku || "Комплектация"}</span><h3>{configuration.name}</h3><p>{configuration.description || "Описание комплектации уточняется."}</p><a href="#request">Запросить состав →</a></article>)}</div></section>}

    {product.solutions.length > 0 && <section className="section shell"><div className="sectionHead"><div><p className="eyebrow">РЕШЕНИЯ</p><h2>Где применяется</h2></div><a href="/solutions">Все решения →</a></div><div className="threeCards">{product.solutions.map((solution)=><article key={solution.id}><h3>{solution.name}</h3><p>{solution.shortDescription}</p><a href={`/solutions/${solution.slug}`}>Подробнее →</a></article>)}</div></section>}

    {product.projects.length > 0 && <section className="section shell"><div className="sectionHead"><div><p className="eyebrow">ПРОЕКТЫ</p><h2>Связанные внедрения</h2></div><a href="/projects">Все проекты →</a></div><div className="homeProjectGrid">{product.projects.map((project)=><article key={project.id}><span>{[project.city, project.year].filter(Boolean).join(" · ") || "Проект"}</span><h3>{project.title}</h3><a href={`/projects/${project.slug}`}>Смотреть проект →</a></article>)}</div></section>}

    {product.relatedProducts.length > 0 && <section className="section shell"><div className="sectionHead"><div><p className="eyebrow">СВЯЗАННЫЕ ТОВАРЫ</p><h2>Совместимость и альтернативы</h2></div></div><div className="relatedProductGrid">{product.relatedProducts.map((relation)=><article key={relation.id}>{relation.product.imageUrl ? <img src={relation.product.imageUrl} alt={relation.product.name} /> : <div className="miniCabinet"></div>}<span>{relationLabels[relation.type] ?? "Связанный товар"}</span><h3>{relation.product.model}</h3><p>{relation.product.shortDescription}</p><a href={`/products/${relation.product.slug}`}>Подробнее →</a></article>)}</div></section>}

    <section id="documents" className="documentsSection shell"><div className="sectionHead"><div><p className="eyebrow">ДОКУМЕНТАЦИЯ</p><h2>Материалы по продукту</h2></div><a href="/support">Весь центр документации →</a></div>{product.documents.length ? <div className="documentGrid">{product.documents.map((document)=><a key={document.id} data-analytics="document_download" data-document-id={document.id} href={document.fileUrl} target="_blank" rel="noreferrer"><span>{document.type}</span><strong>{document.title}</strong><small>{document.version ? `Версия ${document.version}` : "Открыть документ"}</small></a>)}</div> : <p className="mutedText">Документы будут опубликованы после переноса технического архива.</p>}</section>

    <section id="request" className="requestSection shell"><div className="requestIntro"><p className="eyebrow">КОНСУЛЬТАЦИЯ</p><h2>Обсудить применение {product.model}</h2><p>Поможем проверить совместимость, подобрать конфигурацию и подготовить коммерческое предложение.</p></div><LeadForm productId={product.id} productLabel={product.model} /></section>
    <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Продукция</b><a href="/products">Каталог</a><a href="/solutions">Решения</a><a href="/support">Документация</a></div><div><b>Компания</b><a href="/projects">Проекты</a><a href="/#contacts">Контакты</a></div><div><b>Связаться</b><a href="tel:+79674232054">+7 (967) 423-20-54</a><a href="mailto:arkhast@mail.ru">arkhast@mail.ru</a></div></div></footer>
  </main>;
}
