import { AdminRole, CorporateMediaSection, MediaType, prisma } from "@elsystar/database";
import { requireRole } from "../../lib/auth";
import { logout } from "../login/actions";
import { addCorporateMedia, createCompetency, createFaq, deleteCompetency, deleteCorporateMedia, deleteFaq, updateCompetency, updateCorporate, updateFaq } from "./actions";

const defaults = {
  companyName: "ООО «Элсистар»",
  aboutEyebrow: "О КОМПАНИИ",
  aboutTitle: "Инженерные решения для управления дорожным движением",
  aboutLead: "ООО «Элсистар» — производитель программируемых контроллеров и сервисного оборудования управления дорожным движением.",
  aboutBody: "Компания основана группой разработчиков контроллеров дорожного движения ОАО «Телеавтоматика». Основная продукция — контроллеры и системы автоматизированного управления дорожным движением. Дорожные контроллеры УК-4.1М и УК-2.5 развивают накопленный многолетний опыт разработки и изготовления оборудования.",
  historyTitle: "Опыт разработки и внедрения",
  historyBody: "АСУДТ «Мегаполис» разрабатывалась и испытывалась компанией в Ростове-на-Дону. На официальном сайте ELSYSTAR указано, что в 2005 году система охватывала 57 перекрёстков, а в 2009 году — 196.",
  productionEyebrow: "ПРОИЗВОДСТВО",
  productionTitle: "Собственное производство оборудования",
  productionLead: "Компания располагает собственными производственными мощностями для выпуска дорожных контроллеров и оборудования АСУДД.",
  productionBody: "Производственное направление включает дорожные контроллеры, модули сопряжения для различных типов контроллеров и модули сбора информации о дорожном движении. ELSYSTAR поставляет как отдельные компоненты и подсистемы АСУДД, так и комплексные решения.",
  competenciesTitle: "Ключевые компетенции",
  supportTitle: "Техническая поддержка оборудования и ПО",
  supportBody: "В центре документации доступны руководства, сертификаты, программы для подготовки и загрузки СОД, а также материалы по АСУДТ «Мегаполис».",
  phonePrimary: "+7 (967) 423-20-54",
  phoneSecondary: "8 (86635) 41034",
  emailPrimary: "arkhast@mail.ru",
  address: "",
  workingHours: "",
  legalName: "ООО «Элсистар»",
  inn: "",
  kpp: "",
  ogrn: "",
};

const sectionLabel: Record<CorporateMediaSection, string> = {
  ABOUT: "О компании",
  PRODUCTION: "Производство",
  CONTACTS: "Контакты",
};

export default async function CorporatePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  const query = await searchParams;
  const [content, faqs, images] = prisma ? await Promise.all([
    prisma.corporateContent.findUnique({ where: { id: "corporate" }, include: { competencies: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }, mediaPlacements: { orderBy: [{ section: "asc" }, { sortOrder: "asc" }], include: { mediaAsset: true } } } }).catch(() => null),
    prisma.faqEntry.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }).catch(() => []),
    prisma.mediaAsset.findMany({ where: { type: MediaType.IMAGE }, orderBy: [{ createdAt: "desc" }], take: 200 }).catch(() => []),
  ]) : [null, [], []];
  const data = content ?? defaults;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6300";

  return <div className="admin"><aside><div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div><nav><a href="/">Обзор</a><a href="/analytics">Аналитика</a><a href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a className="active" href="/corporate">Компания</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a><a href="/seo">SEO</a><a href="/users">Пользователи</a><a href="/audit">Журнал действий</a></nav></aside><main>
    <header><div><span>Корпоративный контент</span><h1>Компания</h1></div><div className="headerActions"><a className="adminButton" href={`${siteUrl}/about`} target="_blank" rel="noreferrer">О компании ↗</a><a className="adminButton" href={`${siteUrl}/production`} target="_blank" rel="noreferrer">Производство ↗</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
    {query.saved && <div className="adminSuccess">Корпоративный контент сохранён.</div>}
    {query.error === "db" && <div className="adminError">База данных недоступна.</div>}
    {!content && <div className="adminNotice">Сейчас публичные страницы используют проверенный fallback-контент со старого официального сайта. Нажмите «Сохранить», чтобы перенести его в CMS. Адрес и реквизиты оставлены пустыми — их нужно заполнять только по подтверждённым документам.</div>}

    <section className="contentCard formCard"><div className="title"><div><h2>Основной корпоративный контент</h2><p className="subtitle">Тексты для страниц «О компании», «Производство», «Контакты» и блока поддержки.</p></div></div><form action={updateCorporate} className="adminForm">
      <label><span>Название компании</span><input name="companyName" defaultValue={data.companyName} required /></label>
      <div className="formDivider"><strong>О компании</strong></div><div className="formGrid two"><label><span>Eyebrow</span><input name="aboutEyebrow" defaultValue={data.aboutEyebrow} /></label><label><span>Заголовок</span><input name="aboutTitle" defaultValue={data.aboutTitle} /></label></div><label><span>Краткое описание</span><textarea name="aboutLead" rows={3} defaultValue={data.aboutLead} /></label><label><span>Основной текст</span><textarea name="aboutBody" rows={6} defaultValue={data.aboutBody ?? ""} /></label><div className="formGrid two"><label><span>Заголовок истории</span><input name="historyTitle" defaultValue={data.historyTitle} /></label><label><span>История / опыт</span><textarea name="historyBody" rows={4} defaultValue={data.historyBody ?? ""} /></label></div>
      <div className="formDivider"><strong>Производство</strong></div><div className="formGrid two"><label><span>Eyebrow</span><input name="productionEyebrow" defaultValue={data.productionEyebrow} /></label><label><span>Заголовок</span><input name="productionTitle" defaultValue={data.productionTitle} /></label></div><label><span>Краткое описание</span><textarea name="productionLead" rows={3} defaultValue={data.productionLead} /></label><label><span>Основной текст</span><textarea name="productionBody" rows={6} defaultValue={data.productionBody ?? ""} /></label><label><span>Заголовок компетенций</span><input name="competenciesTitle" defaultValue={data.competenciesTitle} /></label>
      <div className="formDivider"><strong>Поддержка</strong></div><label><span>Заголовок</span><input name="supportTitle" defaultValue={data.supportTitle} /></label><label><span>Описание</span><textarea name="supportBody" rows={4} defaultValue={data.supportBody ?? ""} /></label>
      <div className="formDivider"><strong>Контакты</strong></div><div className="formGrid two"><label><span>Основной телефон</span><input name="phonePrimary" defaultValue={data.phonePrimary ?? ""} /></label><label><span>Дополнительный телефон</span><input name="phoneSecondary" defaultValue={data.phoneSecondary ?? ""} /></label><label><span>E-mail</span><input name="emailPrimary" type="email" defaultValue={data.emailPrimary ?? ""} /></label><label><span>Режим работы</span><input name="workingHours" defaultValue={data.workingHours ?? ""} /></label></div><label><span>Адрес</span><input name="address" defaultValue={data.address ?? ""} placeholder="Не публиковать до подтверждения" /></label>
      <div className="formDivider"><strong>Реквизиты</strong></div><div className="formGrid two"><label><span>Юридическое наименование</span><input name="legalName" defaultValue={data.legalName ?? ""} /></label><label><span>ИНН</span><input name="inn" defaultValue={data.inn ?? ""} /></label><label><span>КПП</span><input name="kpp" defaultValue={data.kpp ?? ""} /></label><label><span>ОГРН</span><input name="ogrn" defaultValue={data.ogrn ?? ""} /></label></div><p className="formHint">ИНН, КПП, ОГРН и адрес намеренно не заполнены автоматически: на текущем официальном сайте эти данные не опубликованы.</p><div className="formActions"><button className="primary" type="submit" disabled={!prisma}>Сохранить корпоративный контент</button></div>
    </form></section>

    <section className="contentCard"><div className="title"><div><h2>Компетенции</h2><p className="subtitle">Карточки на страницах компании и производства.</p></div><span>{content?.competencies.length ?? 0}</span></div><div className="corporateAdminList">{content?.competencies.map((item) => <article key={item.id}><form action={updateCompetency.bind(null, item.id)} className="corporateRowForm"><input name="title" defaultValue={item.title} required /><input name="description" defaultValue={item.description ?? ""} placeholder="Описание" /><input name="sortOrder" type="number" defaultValue={item.sortOrder} /><button type="submit">Сохранить</button></form><form action={deleteCompetency.bind(null, item.id)}><button className="dangerText" type="submit">Удалить</button></form></article>)}</div><form action={createCompetency} className="inlineForm corporateAddForm"><label><span>Компетенция</span><input name="title" required /></label><label><span>Описание</span><input name="description" /></label><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue="0" /></label><button className="primary" type="submit">Добавить</button></form></section>

    <section className="contentCard"><div className="title"><div><h2>Изображения корпоративных страниц</h2><p className="subtitle">Используются только изображения из общей медиатеки.</p></div><a href="/media">Медиатека →</a></div><div className="corporateMediaAdmin">{content?.mediaPlacements.map((placement) => <article key={placement.id}><img src={placement.mediaAsset.url} alt="" /><div><span>{sectionLabel[placement.section]}</span><strong>{placement.mediaAsset.title}</strong><small>{placement.caption || "Без подписи"}</small></div><form action={deleteCorporateMedia.bind(null, placement.id)}><button className="dangerText" type="submit">Удалить</button></form></article>)}</div><form action={addCorporateMedia} className="inlineForm corporateMediaForm"><label><span>Изображение</span><select name="mediaAssetId" required><option value="">Выберите…</option>{images.map((image)=><option key={image.id} value={image.id}>{image.title}</option>)}</select></label><label><span>Раздел</span><select name="section" defaultValue={CorporateMediaSection.ABOUT}>{Object.values(CorporateMediaSection).map((section)=><option key={section} value={section}>{sectionLabel[section]}</option>)}</select></label><label><span>Подпись</span><input name="caption" /></label><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue="0" /></label><button className="primary" type="submit">Привязать</button></form>{!images.length && <p className="empty">В медиатеке пока нет изображений. Сначала добавьте их в разделе «Медиа».</p>}</section>

    <section className="contentCard"><div className="title"><div><h2>FAQ</h2><p className="subtitle">Общие вопросы по документации, ПО, поддержке и коммерческим обращениям.</p></div><a href={`${siteUrl}/faq`} target="_blank" rel="noreferrer">Открыть FAQ ↗</a></div><div className="faqAdminList">{faqs.map((entry)=><article key={entry.id}><form action={updateFaq.bind(null, entry.id)} className="faqEditForm"><input name="question" defaultValue={entry.question} required /><textarea name="answer" rows={3} defaultValue={entry.answer} required /><input name="sortOrder" type="number" defaultValue={entry.sortOrder} /><label className="checkLine"><input name="active" type="checkbox" defaultChecked={entry.active} /><span>Публиковать</span></label><button type="submit">Сохранить</button></form><form action={deleteFaq.bind(null, entry.id)}><button className="dangerText" type="submit">Удалить</button></form></article>)}</div><form action={createFaq} className="adminForm compactForm"><label><span>Вопрос</span><input name="question" required /></label><label><span>Ответ</span><textarea name="answer" rows={3} required /></label><div className="formGrid two"><label><span>Порядок</span><input name="sortOrder" type="number" defaultValue="0" /></label><label className="checkbox"><input name="active" type="checkbox" defaultChecked /><span>Публиковать</span></label></div><button className="primary" type="submit">Добавить вопрос</button></form></section>
    <footer>v0.1.0-alpha.8 · Corporate Content</footer>
  </main></div>;
}
