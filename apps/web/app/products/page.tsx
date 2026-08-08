import { getPublishedProducts } from "../../lib/products";

export default async function ProductsPage() {
  const products = await getPublishedProducts();

  return (
    <main>
      <header className="header shell">
        <a className="logo" href="/">ELSY<span>STAR</span></a>
        <nav><a href="/products">Продукция</a><a href="/#solutions">Решения</a><a href="/#megapolis">ПО</a><a href="/#support">Документация</a><a href="/#company">О компании</a><a href="/#contacts">Контакты</a></nav>
        <div className="actions"><span>RU / EN</span><a className="button small" data-analytics="cta_click" href="/#contacts">Получить КП</a></div>
      </header>

      <section className="catalogHero shell">
        <p className="eyebrow">ПРОДУКЦИЯ</p>
        <h1>Дорожные контроллеры ELSYSTAR</h1>
        <p className="lead">Оборудование для локального и сетевого управления транспортными и пешеходными потоками.</p>
      </section>

      <section className="catalogGrid shell">
        {products.map((product) => (
          <article key={product.id} className="catalogCard">
            <div className="catalogCabinet"><span>ELSYSTAR</span></div>
            <div>
              <p className="eyebrow">{product.model}</p>
              <h2>{product.name}</h2>
              <p>{product.shortDescription}</p>
              <div className="catalogSpecs">
                {product.specifications.slice(0, 3).map((specification) => <span key={specification.id}>{specification.label}: <b>{specification.value}{specification.unit ? ` ${specification.unit}` : ""}</b></span>)}
              </div>
              <a className="textLink" data-analytics="product_view" data-product-id={product.id} href={`/products/${product.slug}`}>Подробнее →</a>
            </div>
          </article>
        ))}
      </section>

      <section className="support shell"><div><p className="eyebrow">ПОДБОР ОБОРУДОВАНИЯ</p><h2>Нужна помощь с конфигурацией?</h2><p>Опишите задачу — подберём подходящий контроллер и состав оборудования.</p></div><a className="button" data-analytics="cta_click" href="/#contacts">Связаться с инженером</a></section>

      <footer className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Продукция</b><a href="/products">Контроллеры</a><a href="/#megapolis">Мегаполис</a></div><div><b>Компания</b><a href="/#company">О компании</a><a href="/#contacts">Контакты</a></div><div><b>Связаться</b><a href="tel:+79674232054">+7 (967) 423-20-54</a><a href="mailto:arkhast@mail.ru">arkhast@mail.ru</a></div></div></footer>
    </main>
  );
}
