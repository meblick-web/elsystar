"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="statePage shell">
      <div className="stateCode">!</div>
      <h1>Не удалось загрузить страницу</h1>
      <p>Попробуйте повторить запрос. Если ошибка сохраняется, нужный раздел можно открыть с главной страницы.</p>
      <div className="stateActions"><button className="button" type="button" onClick={reset}>Повторить</button><a className="button ghost" href="/">На главную</a></div>
    </main>
  );
}
