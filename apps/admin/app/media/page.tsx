import { MediaType, prisma } from "@elsystar/database";
import { requireAdmin } from "../../lib/auth";
import { createMediaAsset, deleteMediaAsset } from "./actions";

const typeLabels: Record<MediaType, string> = { IMAGE: "Изображение", VIDEO: "Видео", FILE: "Файл" };

export default async function MediaPage() {
  await requireAdmin();
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
        <div className="noticeBox">Хранилище пока provider-neutral: сюда добавляются URL и метаданные. Физическую загрузку файлов подключим после выбора хостинга/storage, не меняя структуру контента.</div>

        <section className="panel formPanel">
          <div className="title"><h2>Добавить медиа</h2><span>URL / storage key</span></div>
          <form action={createMediaAsset} className="adminForm">
            <div className="adminFormGrid">
              <label>Название<input name="title" required /></label>
              <label>Тип<select name="type" defaultValue={MediaType.IMAGE}>{Object.values(MediaType).map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label>
              <label>URL<input name="url" type="url" required placeholder="https://..." /></label>
              <label>ALT-текст<input name="alt" placeholder="Описание изображения" /></label>
              <label>Продукт<select name="productId" defaultValue=""><option value="">Без привязки</option>{products.map((product) => <option key={product.id} value={product.id}>{product.model}</option>)}</select></label>
              <label>Storage provider<input name="storageProvider" defaultValue="external" /></label>
              <label>Storage key<input name="storageKey" placeholder="optional/path/file.jpg" /></label>
              <label>MIME<input name="mimeType" placeholder="image/jpeg" /></label>
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
