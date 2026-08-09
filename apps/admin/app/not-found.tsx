export default function NotFound() {
  return (
    <main className="adminState">
      <div className="adminStateCode">404</div>
      <h1>Раздел не найден</h1>
      <p>Запрашиваемая страница панели управления отсутствует или была перемещена.</p>
      <div className="adminStateActions"><a className="primary" href="/">К обзору</a></div>
    </main>
  );
}
