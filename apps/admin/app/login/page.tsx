import { isAdminAuthConfigured } from "../../lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const configured = isAdminAuthConfigured();

  return (
    <main className="loginPage">
      <section className="loginCard">
        <div className="brand loginBrand">ELSY<span>STAR</span><small>ADMIN</small></div>
        <p className="loginEyebrow">ПАНЕЛЬ УПРАВЛЕНИЯ</p>
        <h1>Вход в ELSYSTAR Admin</h1>
        <p className="loginLead">Управление каталогом, документами, заявками и аналитикой сайта.</p>

        {!configured && (
          <div className="loginNotice">
            Для входа задайте <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> и <code>ADMIN_SESSION_SECRET</code>.
          </div>
        )}

        {params.error && <div className="loginError">Неверный email или пароль.</div>}

        <form action="/api/auth/login" method="post" className="loginForm">
          <label>
            <span>Email</span>
            <input name="email" type="email" autoComplete="username" required disabled={!configured} />
          </label>
          <label>
            <span>Пароль</span>
            <input name="password" type="password" autoComplete="current-password" required disabled={!configured} />
          </label>
          <button className="primary loginButton" type="submit" disabled={!configured}>Войти</button>
        </form>
      </section>
    </main>
  );
}
