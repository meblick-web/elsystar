const products = [
  { name: "УК-4.1М", text: "Универсальный дорожный контроллер для сложных светофорных объектов." },
  { name: "УК-2.5", text: "Компактное решение для локального управления движением." },
];

export default function Home() {
  return (
    <main>
      <header className="header shell">
        <a className="logo" href="#">ELSY<span>STAR</span></a>
        <nav><a href="#products">Продукция</a><a href="#solutions">Решения</a><a href="#megapolis">ПО</a><a href="#support">Документация</a><a href="#company">О компании</a><a href="#contacts">Контакты</a></nav>
        <div className="actions"><span>RU / EN</span><a className="button small" href="#contacts">Получить КП</a></div>
      </header>

      <section className="hero shell">
        <div className="heroCopy">
          <p className="eyebrow">ИНТЕЛЛЕКТУАЛЬНЫЕ ТРАНСПОРТНЫЕ СИСТЕМЫ</p>
          <h1>Контроллеры и системы управления дорожным движением</h1>
          <p className="lead">Разрабатываем оборудование и программные решения для безопасного и эффективного управления городской транспортной инфраструктурой.</p>
          <div className="heroButtons"><a className="button" href="#solutions">Подобрать решение</a><a className="button ghost" href="#products">Каталог продукции</a></div>
        </div>
        <div className="heroVisual" aria-label="Концептуальная визуализация контроллера">
          <div className="signal"><i></i><i></i><i className="active"></i></div>
          <div className="cabinet"><div className="cabinetLogo">ELSYSTAR</div><div className="vents"></div><div className="handle"></div><small>УК-4.1М</small></div>
          <div className="dashboard"><b>Мегаполис</b><span>Состояние сети</span><strong>● Нормально</strong><div className="chart"></div></div>
        </div>
      </section>

      <section className="trust shell"><div><strong>30+</strong><span>лет инженерного опыта</span></div><div><strong>Собственное</strong><span>производство оборудования</span></div><div><strong>Комплексно</strong><span>от контроллера до АСУДТ</span></div></section>

      <section id="solutions" className="section shell">
        <p className="eyebrow">НАПРАВЛЕНИЯ</p><h2>Всё необходимое для управления движением</h2>
        <div className="threeCards">
          <article><div className="icon">◇</div><h3>Дорожные контроллеры</h3><p>Надёжное управление светофорными объектами и периферией.</p><a href="#products">Подробнее →</a></article>
          <article><div className="icon">⌁</div><h3>АСУДТ «Мегаполис»</h3><p>Централизованное управление, мониторинг и диспетчеризация.</p><a href="#megapolis">Подробнее →</a></article>
          <article><div className="icon">↓</div><h3>Документация и поддержка</h3><p>Инструкции, сертификаты, ПО, прошивки и техническая помощь.</p><a href="#support">Перейти →</a></article>
        </div>
      </section>

      <section id="megapolis" className="megapolis shell">
        <div><p className="eyebrow">ПЛАТФОРМА</p><h2>АСУДТ «Мегаполис»</h2><p>Единая среда для контроля дорожных объектов, режимов работы и состояния городской сети. На главной странице показываем только главное — подробности раскрываются внутри решения.</p><a className="textLink" href="#">О системе →</a></div>
        <div className="map"><span className="road r1"></span><span className="road r2"></span><span className="road r3"></span><i></i><i></i><i></i></div>
      </section>

      <section id="products" className="section shell">
        <div className="sectionHead"><div><p className="eyebrow">ПРОДУКЦИЯ</p><h2>Основные контроллеры</h2></div><a href="#">Вся продукция →</a></div>
        <div className="productGrid">{products.map((product) => <article key={product.name}><div className="miniCabinet"></div><div><h3>{product.name}</h3><p>{product.text}</p><a href="#">Подробнее →</a></div></article>)}</div>
      </section>

      <section id="support" className="support shell"><div><p className="eyebrow">ПОДДЕРЖКА</p><h2>Документы и помощь — в одном месте</h2><p>Быстрый доступ к руководствам, сертификатам, ПО и актуальным версиям материалов.</p></div><a className="button ghost" href="#">Открыть документацию</a></section>

      <footer id="contacts" className="footer"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Интеллектуальные решения для управления движением.</p></div><div><b>Продукция</b><a href="#products">Контроллеры</a><a href="#megapolis">Мегаполис</a><a href="#support">Документация</a></div><div><b>Компания</b><a href="#company">О компании</a><a href="#">Проекты</a><a href="#contacts">Контакты</a></div><div><b>Связаться</b><a href="tel:+79674232054">+7 (967) 423-20-54</a><a href="mailto:arkhast@mail.ru">arkhast@mail.ru</a></div></div></footer>
    </main>
  );
}
