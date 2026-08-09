import { AdminRole, MediaType, prisma } from "@elsystar/database";
import { requireRole } from "../../lib/auth";
import { createMediaAsset, deleteMediaAsset } from "./actions";

const typeLabels: Record<MediaType, string> = { IMAGE: "Изображение", VIDEO: "Видео", FILE: "Файл" };

export default async function MediaPage() {
  await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  const [assets, products] = prisma ? await Promise.all([
    prisma.mediaAsset.findMany({ orderBy: [{ createdAt: "desc" }], include: { product: { select: { model: true } } } }),
    prisma.product.findMany({ orderBy: { model: "asc" }, select: { id: true, model: true } }),
  ]) : [[], []];

  return (
    <div className="admin">
      <aside>
        <div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div>
        <nav><a href="/">Обзор</a><a href="/products">Продукция</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a className="active" href="/media">Медиа</a></nav>
      </aside>
      <main>
        <header><div><span>Изображения и файлы</span><h1>Медиатека</h1></div><a className="adminButton" href="/">← Обзор</a></header>
        <div className="noticeBox">Хранилище provider-neutral: сейчас сохраняются URL и проверенные метаданные. Разрешены только HTTP/HTTPS URL и ограниченный набор MIME. Физическую загрузку подключим после выбора production storage.</div>

        <section className="panel formPanel">
          <div className="title"><h2>Добавить медиа</h2><span>URL / storage key</span></div>
          <form action={createMediaAsset} className="adminForm">
            <div className="adminFormGrid">
              <label>Название<input name="title" required maxLength={200} /></label>
              <label>Тип<select name="type" defaultValue={MediaType.IMAGE}>{Object.values(MediaType).map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label>
              <label>URL<input name="url" type="url" required maxLength={2048} placeholder="https://..." /></label>
              <label>ALT-текст<input name="alt" maxLength={300} placeholder="Описание изображения" /></label>
              <label>Продукт<select name="productId" defaultValue=""><option value="">Без привязки</option>{products.map((product) => <option key={product.id} value={product.id}>{product.model}</option>)}</select></label>
              <label>Storage provider<input name="storageProvider" maxLength={50} defaultValue="external" /></label>
              <label>Storage key<input name="storageKey" maxLength={500} placeholder="optional/path/file.jpg" /></label>
              <label>MIME<input name="mimeType" maxLength={120} placeholder="image/jpeg" /></label>
              <label>Размер, байт<input name="fileSize" type="number" min="1" max={250 * 1024 * 1024} /></label>
              <label>Порядок<input name="sortOrder" type="number" defaultValue="0" /></label>
            </div>
            <button className="primary" type="submit" disabled={!prisma}>Добавить</button>
          </form>
        </section>

        <section className="panel">
          <div className="title"><h2>Файлы</h2><span>{assets.length}</span></div>
          {assets.length ? <div className="mediaGrid">{assets.map((asset) => <article className="mediaCard" key={asset.id}>
            <div className="mediaPreview">{asset.type === MediaType.IMAGE ? <img src={asset.url} alt={asset.alt || asset.title} /> : <span>{typeLabels[asset.type]}</span>}</div>
            <div className="mediaCardBody"><small>{typeLabels[asset.type]} · {asset.storageProvider}</small><strong>{asset.title}</strong><span>{asset.product?.model || "Без привязки"}</span><div className="rowActions"><a href={asset.url} target="_blank" rel="noreferrer">Открыть ↗</a><form action={deleteMediaAsset.bind(null, asset.id)}><button className="dangerButton" type="submit">Удалить</button></form></div></div>
          </article>)}</div> : <p className="empty">Медиатека пока пуста.</p>}
        </section>
      </main>
    </div>
  );
}
