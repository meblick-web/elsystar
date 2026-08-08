import { DocumentType, prisma } from "@elsystar/database";
import { requireAdmin } from "../../lib/auth";
import { createDocument, deleteDocument, toggleDocument } from "./actions";

const typeLabels: Record<DocumentType, string> = {
  MANUAL: "Руководство",
  CERTIFICATE: "Сертификат",
  SOFTWARE: "ПО",
  FIRMWARE: "Прошивка",
  SCHEME: "Схема",
  PASSPORT: "Паспорт",
  OTHER: "Другое",
};

export default async function DocumentsPage() {
  await requireAdmin();
  const [documents, products] = prisma ? await Promise.all([
    prisma.document.findMany({ orderBy: { createdAt: "desc" }, include: { product: { select: { model: true } } } }),
    prisma.product.findMany({ orderBy: { model: "asc" }, select: { id: true, model: true } }),
  ]) : [[], []];

  return (
    <div className="admin">
      <aside>
        <div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div>
        <nav><a href="/">Обзор</a><a href="/products">Продукция</a><a className="active" href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a></nav>
      </aside>
      <main>
        <header><div><span>Файлы, версии и публикация</span><h1>Документация</h1></div><a className="adminButton" href="/">← Обзор</a></header>
        {!prisma ? <div className="noticeBox">PostgreSQL не подключён. Интерфейс готов, но сохранение документов временно недоступно.</div> : null}

        <section className="panel formPanel">
          <div className="title"><h2>Добавить материал</h2><span>URL-based storage</span></div>
          <form action={createDocument} className="adminForm">
            <div className="adminFormGrid">
              <label>Название<input name="title" required /></label>
              <label>Тип<select name="type" defaultValue={DocumentType.MANUAL}>{Object.values(DocumentType).map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label>
              <label>URL файла<input name="fileUrl" type="url" required placeholder="https://..." /></label>
              <label>Имя файла<input name="fileName" required placeholder="uk-4-1m-manual.pdf" /></label>
              <label>Версия<input name="version" placeholder="2.3" /></label>
              <label>Язык<input name="language" defaultValue="ru" /></label>
              <label>Продукт<select name="productId" defaultValue=""><option value="">Без привязки</option>{products.map((product) => <option key={product.id} value={product.id}>{product.model}</option>)}</select></label>
              <label className="checkLabel"><input type="checkbox" name="isPublic" defaultChecked /> Показывать публично</label>
              <label className="checkLabel"><input type="checkbox" name="published" defaultChecked /> Опубликовать сейчас</label>
            </div>
            <label>Описание<textarea name="description" rows={3} /></label>
            <button className="primary" type="submit" disabled={!prisma}>Добавить документ</button>
          </form>
        </section>

        <section className="panel adminTablePanel">
          <div className="title"><h2>Материалы</h2><span>{documents.length}</span></div>
          {documents.length ? <div className="adminTable documentsTable">
            <div className="adminTableRow adminTableHead"><span>Документ</span><span>Тип</span><span>Продукт</span><span>Публикация</span><span>Действия</span></div>
            {documents.map((document) => <div className="adminTableRow" key={document.id}>
              <div><strong>{document.title}</strong><small>{document.fileName}{document.version ? ` · v${document.version}` : ""}</small></div>
              <span>{typeLabels[document.type]}</span>
              <span>{document.product?.model || "—"}</span>
              <div><strong>{document.publishedAt ? "Опубликован" : "Черновик"}</strong><small>{document.isPublic ? "Публичный" : "Скрытый"}</small></div>
              <div className="rowActions"><a href={document.fileUrl} target="_blank" rel="noreferrer">Открыть ↗</a><form action={toggleDocument.bind(null, document.id)}><button type="submit">{document.publishedAt ? "Снять" : "Опубликовать"}</button></form><form action={deleteDocument.bind(null, document.id)}><button type="submit" className="dangerButton">Удалить</button></form></div>
            </div>)}
          </div> : <p className="empty">Документов пока нет.</p>}
        </section>
      </main>
    </div>
  );
}
