import { LeadStatus, prisma } from "@elsystar/database";
import { requireAdmin } from "../../lib/auth";
import { updateLeadStatus } from "./actions";

const statusLabels: Record<LeadStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Обработана",
  CLOSED: "Закрыта",
  SPAM: "Спам",
};

export default async function LeadsPage() {
  await requireAdmin();
  const leads = prisma ? await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: { select: { model: true } } },
  }) : [];

  return (
    <div className="admin">
      <aside>
        <div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div>
        <nav><a href="/">Обзор</a><a href="/products">Продукция</a><a href="/documents">Документация</a><a className="active" href="/leads">Заявки</a><a href="/media">Медиа</a></nav>
      </aside>
      <main>
        <header><div><span>Обращения с публичного сайта</span><h1>Заявки</h1></div><a className="adminButton" href="/">← Обзор</a></header>
        {!prisma ? <div className="noticeBox">PostgreSQL не подключён. После подключения заявки с публичной формы будут появляться здесь.</div> : null}
        <section className="panel adminTablePanel">
          <div className="title"><h2>Входящие обращения</h2><span>{leads.length}</span></div>
          {leads.length ? <div className="adminTable leadsTable">
            <div className="adminTableRow adminTableHead"><span>Контакт</span><span>Интерес</span><span>Источник</span><span>Дата</span><span>Статус</span></div>
            {leads.map((lead) => (
              <div className="adminTableRow" key={lead.id}>
                <div><strong>{lead.name}</strong><small>{lead.company || "Без компании"}</small><small>{lead.phone || lead.email || "Контакт не указан"}</small>{lead.message ? <p>{lead.message}</p> : null}</div>
                <div><strong>{lead.product?.model || "Общий запрос"}</strong><small>{lead.sourcePath || "—"}</small></div>
                <div><strong>{lead.utmSource || lead.source || "direct"}</strong><small>{lead.utmCampaign || lead.referrer || "—"}</small></div>
                <span>{lead.createdAt.toLocaleString("ru-RU")}</span>
                <form action={updateLeadStatus.bind(null, lead.id)}>
                  <select name="status" defaultValue={lead.status}>{Object.values(LeadStatus).map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select>
                  <button type="submit">Сохранить</button>
                </form>
              </div>
            ))}
          </div> : <p className="empty">Пока обращений нет.</p>}
        </section>
      </main>
    </div>
  );
}
