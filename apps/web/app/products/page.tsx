import { getPublishedCategories, getPublishedProducts } from "../../lib/products";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const query = await searchParams;
  const selectedCategory = query.category?.trim() || undefined;
  const [products, categories] = await Promise.all([getPublishedProducts(selectedCategory), getPublishedCategories()]);
  const active = categories.find((category) => category.slug === selectedCategory);

  return <main>
    <header className="header shell"><a className="logo" href="/">ELSY<span>STAR</span></a><nav><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/support">Документация</a><a href="/#contacts">Контакты</a></nav><div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="/#request">Получить КП</a></div></header>

    <section className="catalogHero shell"><p className="eyebrow">ПРОДУКЦИЯ</p><h1>{active ? active.name : "Каталог оборудования ELSYSTAR"}</h1><p className="lead">{active?.description || "Дорожные контроллеры, оборудование и компоненты для локального и централизованного управления транспортной инфраструктурой."}</p></section>

    <section className="catalogFilters shell"><a className={!selectedCategory ? "active" : ""} href="/products">Все</a>{categories.map((category)=><a className={selectedCategory === category.slug ? "active" : ""} key={category.id} href={`/products?category=${encodeURIComponent(category.slug)}`}>{category.parent ? `${category.parent.name} / ` : ""}{category.name}</a>)}</section>

    <section className="catalogGrid shell">{products.map((product)=><article key={product.id} className="catalogCard">
      <div className="catalogMedia">{product.mediaAssets[0] ? <img src={product.mediaAssets[0].url} alt={product.mediaAssets[0].alt ?? product.name} /> : <div className="catalogCabinet"><span>ELSYSTAR</span></div>}</div>
      <div><p className="eyebrow">{product.category?.name ?? "ELSYSTAR"}</p><h2>{product.model}</h2><h3>{product.name}</h3><p>{product.shortDescription}</p><div className="catalogSpecs">{product.specifications.slice(0,3).map((specification)=><span key={specification.id}>{specification.label}: <b>{specification.value}{specification.unit ? ` ${specification.unit}` : ""}</b></span>)}</div><div className="catalogMeta"><span>{product.features.length ? `${product.features.length} преимуществ` : ""}</span><span>{product.documents.length ? `${product.documents.length} документов` : ""}</span></div><a className="textLink" data-analytics="product_view" data-product-id={product.id} href={`/products/${product.slug}`}>Подробнее →</a></div>
    </article>)}</section>

    {!products.length && <section className="shell emptyCatalog"><h2>В этой категории пока нет опубликованных товаров</h2><p>Карточки появятся после публикации продукции в административной панели.</p><a className="button ghost" href="/products">Вернуться ко всему каталогу</a></section>}
    <section className="support shell"><div><p className="eyebrow">ПОДБОР ОБОРУДОВАНИЯ</p><h2>Нужна помощь с конфигурацией?</h2><p>Опишите объект и требования — поможем подобрать оборудование и связанные решения.</p></div><a className="button" data-analytics="cta_click" href="/#request">Связаться с инженером</a></section>
    <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Продукция</b><a href="/products">Каталог</a><a href="/solutions">Решения</a></div><div><b>Компания</b><a href="/projects">Проекты</a><a href="/#contacts">Контакты</a></div><div><b>Поддержка</b><a href="/support">Документация</a></div></div></footer>
  </main>;
}
