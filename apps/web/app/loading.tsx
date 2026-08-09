export default function Loading() {
  return (
    <main className="statePage shell" aria-busy="true" aria-live="polite">
      <div className="stateMark">ELSYSTAR</div>
      <div className="stateSpinner" aria-hidden="true" />
      <h1>Загружаем страницу</h1>
      <p>Подготавливаем актуальные данные каталога и сайта.</p>
    </main>
  );
}
