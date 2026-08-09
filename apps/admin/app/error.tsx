"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="adminState">
      <div className="adminStateCode">!</div>
      <h1>Не удалось загрузить раздел</h1>
      <p>Повторите запрос. Изменения в данных не выполняются, пока экран находится в состоянии ошибки.</p>
      <div className="adminStateActions"><button className="primary" type="button" onClick={reset}>Повторить</button><a className="adminButton" href="/">К обзору</a></div>
    </main>
  );
}
