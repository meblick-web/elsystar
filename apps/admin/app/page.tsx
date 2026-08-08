const metrics = [
  ["Посетители", "4 821", "+12%"],
  ["Просмотры", "12 740", "+9%"],
  ["Заявки КП", "96", "+18%"],
  ["Скачивания", "384", "+7%"],
];

const pages = [
  ["УК-4.1М", "1 482"],
  ["АСУДТ «Мегаполис»", "1 103"],
  ["Продукция", "847"],
  ["Документация", "694"],
];

export default function Admin() {
  return (
    <div className="admin">
      <aside>
        <div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div>
        <nav>
          {[
            "Обзор", "Аналитика", "Продукция", "Решения", "Мегаполис", "Проекты",
            "Документация", "Заявки", "Медиа", "SEO", "Пользователи", "Журнал действий", "Настройки"
          ].map((item, index) => <a className={index === 0 ? "active" : ""} key={item} href="#">{item}</a>)}
        </nav>
      </aside>

      <main>
        <header><div><span>Панель управления</span><h1>Обзор</h1></div><button>Открыть сайт ↗</button></header>

        <section className="metrics">
          {metrics.map((metric) => <article key={metric[0]}><span>{metric[0]}</span><strong>{metric[1]}</strong><small>{metric[2]} к прошлому периоду</small></article>)}
        </section>

        <section className="grid">
          <article className="chartCard"><div className="title"><h2>Посещаемость</h2><span>30 дней</span></div><div className="bars">{[42,55,48,67,61,72,58,78,69,83,76,92,88,96].map((height,index) => <i key={index} style={{height:`${height}%`}} />)}</div></article>
          <article><div className="title"><h2>Популярные страницы</h2><a href="#">Все →</a></div><div className="list">{pages.map((page,index) => <div key={page[0]}><span><b>{index+1}</b>{page[0]}</span><strong>{page[1]}</strong></div>)}</div></article>
        </section>

        <section className="grid lower">
          <article><div className="title"><h2>Каталог</h2><a href="#">Управлять →</a></div><div className="catalog"><div><strong>2</strong><span>продукта</span></div><div><strong>0</strong><span>черновиков</span></div><div><strong>0</strong><span>архивных</span></div></div><button className="primary">+ Добавить продукт</button></article>
          <article><div className="title"><h2>Последние заявки</h2><a href="#">Все →</a></div><p className="empty">Заявки появятся здесь после подключения форм публичного сайта.</p></article>
        </section>

        <footer>v0.1.0-alpha.1 · Platform Foundation</footer>
      </main>
    </div>
  );
}
