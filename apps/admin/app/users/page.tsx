import { AdminRole, prisma } from "@elsystar/database";
import { requireRole } from "../../lib/auth";
import { logout } from "../login/actions";
import { createUser, resetUserPassword, updateUser } from "./actions";

const roleLabel: Record<AdminRole, string> = {
  ADMIN: "Администратор",
  EDITOR: "Редактор",
  SUPPORT: "Поддержка",
  ANALYST: "Аналитик",
};

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const session = await requireRole(AdminRole.ADMIN);
  const query = await searchParams;
  const users = prisma ? await prisma.adminUser.findMany({ orderBy: [{ active: "desc" }, { email: "asc" }] }).catch(() => []) : [];

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="/seo">SEO</a><a className="active" href="/users">Пользователи</a><a href="/audit">Журнал действий</a></nav></aside><main>
    <header><div><span>Безопасность</span><h1>Пользователи и роли</h1></div><div className="headerActions"><span className="roleChip">{roleLabel[session.role]}</span><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {query.created && <div className="adminSuccess">Пользователь создан.</div>}
    {query.error === "required" && <div className="adminError">Укажите email и пароль не короче 10 символов.</div>}
    {query.error === "password" && <div className="adminError">Новый пароль должен содержать не менее 10 символов.</div>}
    {query.error === "self" && <div className="adminError">Нельзя отключить собственную учётную запись.</div>}
    {!prisma && <div className="adminNotice">Для управления пользователями требуется PostgreSQL.</div>}

    <section className="contentCard"><div className="title"><div><h2>Учётные записи</h2><p className="subtitle">{users.length} пользователей</p></div></div>
      <div className="userCards">{users.map((user) => {
        const update = updateUser.bind(null, user.id);
        const reset = resetUserPassword.bind(null, user.id);
        return <article className="userCard" key={user.id}><div className="userIdentity"><strong>{user.name || user.email}</strong><span>{user.email}</span><small>{user.lastLoginAt ? `Последний вход: ${user.lastLoginAt.toLocaleString("ru-RU")}` : "Ещё не входил"}</small></div>
          <form action={update} className="userSettings"><input name="name" defaultValue={user.name ?? ""} placeholder="Имя" /><select name="role" defaultValue={user.role}>{Object.values(AdminRole).map((role) => <option value={role} key={role}>{roleLabel[role]}</option>)}</select><label className="checkLine compact"><input type="checkbox" name="active" defaultChecked={user.active} /><span>Активен</span></label><button type="submit">Сохранить</button></form>
          <form action={reset} className="passwordReset"><input type="password" name="password" minLength={10} placeholder="Новый пароль" required /><button type="submit">Сменить пароль</button></form>
        </article>;
      })}</div>
    </section>

    <section className="contentCard formCard" id="new"><div className="title"><div><h2>Новый пользователь</h2><p className="subtitle">Bootstrap-доступ из .env после этого остаётся резервным.</p></div></div><form action={createUser} className="adminForm"><div className="formGrid two"><label><span>Email *</span><input type="email" name="email" required disabled={!prisma} /></label><label><span>Имя</span><input name="name" disabled={!prisma} /></label><label><span>Роль</span><select name="role" defaultValue={AdminRole.EDITOR} disabled={!prisma}>{Object.values(AdminRole).map((role) => <option value={role} key={role}>{roleLabel[role]}</option>)}</select></label><label><span>Пароль *</span><input type="password" name="password" minLength={10} required disabled={!prisma} /></label></div><div className="formActions"><button className="primary" type="submit" disabled={!prisma}>Создать пользователя</button></div></form></section>
    <footer>v0.1.0-alpha.5 · Users & Roles</footer>
  </main></div>;
}
