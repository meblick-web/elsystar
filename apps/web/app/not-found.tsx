export default function NotFound() {
  return (
    <main className="statePage shell">
      <div className="stateCode">404</div>
      <h1>Страница не найдена</h1>
      <p>Адрес мог измениться или материал ещё не опубликован.</p>
      <div className="stateActions"><a className="button" href="/">На главную</a><a className="button ghost" href="/products">Каталог продукции</a></div>
    </main>
  );
}
