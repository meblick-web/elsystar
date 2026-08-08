import { isDatabaseConfigured, prisma } from "@elsystar/database";
import { requireAdmin } from "../../lib/auth";
import { logout } from "../login/actions";
import { updateHomepage } from "./actions";

const fallback = {
  heroEyebrow: "ИНТЕЛЛЕКТУАЛЬНЫЕ ТРАНСПОРТНЫЕ СИСТЕМЫ",
  heroTitle: "Контроллеры и системы управления дорожным движением",
  heroDescription: "Разрабатываем оборудование и программные решения для безопасного и эффективного управления городской транспортной инфраструктурой.",
  primaryCtaLabel: "Подобрать решение",
  primaryCtaHref: "/solutions",
  secondaryCtaLabel: "Каталог продукции",
  secondaryCtaHref: "/products",
  solutionsEyebrow: "НАПРАВЛЕНИЯ",
  solutionsTitle: "Всё необходимое для управления движением",
  projectsEyebrow: "ПРОЕКТЫ",
  projectsTitle: "Решения, работающие на реальных объектах",
  supportTitle: "Документы и помощь — в одном месте",
  supportDescription: "Быстрый доступ к руководствам, сертификатам, ПО и актуальным версиям материалов.",
};

export default async function HomepageEditor({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const configured = isDatabaseConfigured() && Boolean(prisma);
  const content = configured && prisma ? await prisma.homepageContent.findUnique({ where: { id: "homepage" } }).catch(() => null) : null;
  const value = content ?? fallback;

  return (
    <div className="admin">
      <aside>
        <div className="brand">ELSY<span>STAR</span><small>ADMIN</small></div>
        <nav><a href="/">Обзор</a><a className="active" href="/homepage">Главная</a><a href="/products">Продукция</a><a href="/solutions">Решения</a><a href="/projects">Проекты</a><a href="/documents">Документация</a><a href="/leads">Заявки</a><a href="/media">Медиа</a></nav>
      </aside>
      <main>
        <header><div><span>Контент</span><h1>Главная страница</h1></div><div className="headerActions"><a className="adminButton" href="/">← Обзор</a><form action={logout}><button type="submit">Выйти</button></form></div></header>
        {!configured && <div className="adminNotice">Подключите <code>DATABASE_URL</code>, чтобы сохранять изменения главной страницы.</div>}
        {params.saved && <div className="adminSuccess">Изменения сохранены.</div>}
        {params.error === "required" && <div className="adminError">Заголовок и описание первого экрана обязательны.</div>}

        <section className="contentCard formCard">
          <form action={updateHomepage} className="adminForm">
            <div className="cmsSection"><div><span className="cmsIndex">01</span><h2>Первый экран</h2></div>
              <label><span>Надзаголовок</span><input name="heroEyebrow" defaultValue={value.heroEyebrow} disabled={!configured} /></label>
              <label><span>Главный заголовок *</span><textarea name="heroTitle" rows={2} defaultValue={value.heroTitle} required disabled={!configured} /></label>
              <label><span>Описание *</span><textarea name="heroDescription" rows={4} defaultValue={value.heroDescription} required disabled={!configured} /></label>
              <div className="formGrid two"><label><span>Основная кнопка</span><input name="primaryCtaLabel" defaultValue={value.primaryCtaLabel} disabled={!configured} /></label><label><span>Ссылка</span><input name="primaryCtaHref" defaultValue={value.primaryCtaHref} disabled={!configured} /></label><label><span>Вторая кнопка</span><input name="secondaryCtaLabel" defaultValue={value.secondaryCtaLabel} disabled={!configured} /></label><label><span>Ссылка</span><input name="secondaryCtaHref" defaultValue={value.secondaryCtaHref} disabled={!configured} /></label></div>
            </div>

            <div className="cmsSection"><div><span className="cmsIndex">02</span><h2>Решения и проекты</h2></div>
              <div className="formGrid two"><label><span>Надзаголовок решений</span><input name="solutionsEyebrow" defaultValue={value.solutionsEyebrow} disabled={!configured} /></label><label><span>Заголовок решений</span><input name="solutionsTitle" defaultValue={value.solutionsTitle} disabled={!configured} /></label><label><span>Надзаголовок проектов</span><input name="projectsEyebrow" defaultValue={value.projectsEyebrow} disabled={!configured} /></label><label><span>Заголовок проектов</span><input name="projectsTitle" defaultValue={value.projectsTitle} disabled={!configured} /></label></div>
            </div>

            <div className="cmsSection"><div><span className="cmsIndex">03</span><h2>Поддержка</h2></div>
              <label><span>Заголовок</span><input name="supportTitle" defaultValue={value.supportTitle} disabled={!configured} /></label>
              <label><span>Описание</span><textarea name="supportDescription" rows={3} defaultValue={value.supportDescription} disabled={!configured} /></label>
            </div>
            <div className="formActions"><button className="primary" type="submit" disabled={!configured}>Сохранить главную</button></div>
          </form>
        </section>
        <footer>v0.1.0-alpha.4 · Homepage CMS</footer>
      </main>
    </div>
  );
}
