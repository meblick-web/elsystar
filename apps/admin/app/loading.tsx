export default function Loading() {
  return (
    <main className="adminState" aria-busy="true" aria-live="polite">
      <div className="adminStateMark">ELSY<span>STAR</span></div>
      <div className="adminStateSpinner" aria-hidden="true" />
      <h1>Загружаем панель</h1>
      <p>Получаем актуальные данные из PostgreSQL.</p>
    </main>
  );
}
