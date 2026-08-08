import { AdminRole, prisma } from "@elsystar/database";
import { requireRole } from "../../lib/auth";
import { logout } from "../login/actions";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ actor?: string; entity?: string; action?: string }> }) {
  await requireRole(AdminRole.ADMIN);
  const query = await searchParams;
  const where = {
    ...(query.actor ? { actorEmail: { contains: query.actor, mode: "insensitive" as const } } : {}),
    ...(query.entity ? { entityType: { contains: query.entity, mode: "insensitive" as const } } : {}),
    ...(query.action ? { action: { contains: query.action, mode: "insensitive" as const } } : {}),
  };
  const logs = prisma ? await prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 250 }).catch(() => []) : [];

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="/seo">SEO</a><a href="/users">Пользователи</a><a className="active" href="/audit">Журнал действий</a></nav></aside><main>
    <header><div><span>Контроль изменений</span><h1>Журнал действий</h1></div><div className="headerActions"><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {!prisma && <div className="adminNotice">Для журнала действий требуется PostgreSQL.</div>}
    <section className="contentCard"><form className="auditFilters"><input name="actor" defaultValue={query.actor ?? ""} placeholder="Пользователь" /><input name="entity" defaultValue={query.entity ?? ""} placeholder="Сущность" /><input name="action" defaultValue={query.action ?? ""} placeholder="Действие" /><button type="submit">Фильтр</button><a className="adminButton" href="/audit">Сбросить</a></form></section>
    <section className="contentCard"><div className="title"><div><h2>Последние операции</h2><p className="subtitle">Показываются последние 250 записей с учётом фильтра.</p></div></div><div className="auditTableWrap"><table className="productTable"><thead><tr><th>Время</th><th>Пользователь</th><th>Действие</th><th>Сущность</th><th>ID</th></tr></thead><tbody>{logs.map((log)=><tr key={log.id}><td>{log.createdAt.toLocaleString("ru-RU")}</td><td>{log.actorEmail}</td><td><code>{log.action}</code></td><td>{log.entityType}</td><td><small>{log.entityId ?? "—"}</small></td></tr>)}</tbody></table>{!logs.length && <p className="empty">Записей пока нет.</p>}</div></section>
    <footer>v0.1.0-alpha.5 · Audit Log</footer>
  </main></div>;
}
