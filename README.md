# ELSYSTAR Platform

Новая web-платформа ELSYSTAR: публичный RU/EN сайт, отдельная административная панель, каталог продукции, решения, проекты, корпоративный контент, документация/ПО, обращения, медиатека, SEO и продуктовая аналитика.

## Текущий baseline

`v0.2.0-beta.5 — Content, Media & Catalog Completion`

## Реализовано

### Public / CMS
- плотная светлая industrial B2B design system с дорожными/ITS-фонами;
- responsive public/admin UI, loading/error/404 и `prefers-reduced-motion`;
- PostgreSQL/CMS — источник истины для редакторского контента;
- CMS главной, продукции, решений, проектов, компании, FAQ, документации и медиатеки;
- русский контур `/...` и английский `/en/...` с отдельными редактируемыми `ContentTranslation`;
- `/localization` для EN-редактирования без дублирования продуктовых сущностей;
- explicit demo-project flag и редактируемые KPI;
- `/content-qa` с разделением критичных пробелов и предупреждений;
- иерархические категории, характеристики, преимущества, комплектации и product relations;
- Documentation & Software Center с сериями, текущими/архивными версиями, release notes и SHA-256.

### Verified catalog content
- УК-4.1М и УК-2.5 с проверенными публичными характеристиками и вариантами комплектации;
- отдельные позиции модулей УК-4.1, инженерных пультов и периферии;
- связи контроллеров с комплектующими/совместимым оборудованием;
- решения: управление перекрёстками, АСУДТ «Мегаполис», модернизация, координация / «Зелёная волна», адаптивное управление, диспетчеризация и мониторинг;
- открытые legacy-руководства, ПО и материалы старого центра поддержки перенесены в CMS как документные серии;
- точечные bootstrap stock-фото контроллеров/решений заменяются официальными ELSYSTAR media URL без перезаписи редакторских изображений;
- источники и правила миграции зафиксированы в `docs/CONTENT-SOURCES.md`;
- цены, неподтверждённые реквизиты, клиенты и фиктивные реальные кейсы автоматически не создаются.

### Analytics / Admin
- посетители, сессии, просмотры, источники, устройства, товары, скачивания, заявки и конверсия;
- роли `ADMIN / EDITOR / SUPPORT / ANALYST`;
- серверный RBAC на маршрутах и mutating actions;
- audit log;
- DB-backed revocable admin sessions;
- 8h HMAC-signed HttpOnly/SameSite Strict session cookie;
- Secure `__Host-` cookie для HTTPS/Codespaces/production.

### Security & Operations
- PostgreSQL-backed rate limiting login/leads/analytics без plaintext IP storage;
- honeypot и validation/payload limits публичных форм/API;
- CSP, frame protection, `nosniff`, Referrer Policy, Permissions Policy, production HSTS;
- allowlist validation media/document URL, MIME, filename и size metadata;
- public/admin `/api/health`;
- PostgreSQL custom-format backup + SHA-256 и guarded restore;
- production security preflight `npm run security:check`;
- production runtime smoke-test RU/EN;
- runbook `docs/OPERATIONS.md`.

### SEO / Migration / Visibility
- единый canonical origin;
- DB-overridable title/description/canonical/index/follow;
- OpenGraph + Twitter metadata;
- RU/EN/x-default hreflang;
- Google/Yandex verification meta через environment;
- `/robots.txt` и CMS-driven `/sitemap.xml`;
- Codespaces/preview закрыты от индексации независимо от CMS;
- admin всегда `noindex,nofollow` + `Disallow: /`;
- sitemap включает опубликованные товары, решения, реальные проекты и актуальную публичную документацию;
- EN dynamic pages попадают в sitemap только при наличии явного перевода primary name/title;
- demo-проекты `noindex` и не используются как реальные внедрения;
- Organization + WebSite + Product + Service + real-project Article JSON-LD без выдуманных Offer/reviews;
- legacy 301 bootstrap старых `.html` URL;
- `npm run seo:check` и hard-coded internal link validation;
- public ISR/revalidate вместо глобального `force-dynamic`.

## GitHub Codespaces

Codespaces поднимает Node.js 22 + PostgreSQL 16 и запускает:

- public proxy: `6300`;
- admin proxy: `6301`;
- внутренние Next.js ports `16300/16301` остаются служебными.

При запуске автоматически:

1. генерируется Prisma Client;
2. синхронизируется development DB schema;
3. импортируется отсутствующий visible content;
4. выполняются content/QA migrations;
5. применяются SEO defaults и legacy redirects;
6. синхронизируется EN localization;
7. один раз применяется beta5 verified catalog/content bootstrap;
8. public/admin перезапускаются на текущей revision;
9. search indexing принудительно остаётся выключенным для preview.

Обновление текущего Codespace:

```bash
git pull && bash .devcontainer/start-preview.sh
```

## Структура

- `apps/web` — публичный Next.js сайт;
- `apps/admin` — отдельная Next.js админка;
- `packages/database` — Prisma/PostgreSQL, rate-limit storage, content/SEO/localization bootstrap scripts;
- `packages/analytics` — контракты аналитики;
- `packages/shared` — общие типы;
- `.devcontainer` — Codespaces environment;
- `scripts` — security/SEO/release preflight, smoke, backup/restore;
- `docs` — architecture, source provenance, runbooks и release notes.

## Локальный запуск

```bash
npm install
npm run db:generate
npm run dev:web
```

Во втором терминале:

```bash
npm run dev:admin
```

Для persistence нужен PostgreSQL и `DATABASE_URL`.

## Основные проверки

```bash
npm run db:generate
npm run security:check
npm run seo:check
npm run release:check
npm run typecheck
npm run build
npm run smoke:production
```

Restore требует явного подтверждения:

```bash
ELSYSTAR_RESTORE_CONFIRM=YES npm run db:restore -- /path/to/elsystar.dump
```

## Production SEO

Preview/Codespaces остаются закрытыми. На реальном HTTPS-host после проверки:

```env
NEXT_PUBLIC_SITE_URL=https://elsystar.com
SEO_INDEXING_ENABLED=true
```

Google Search Console / Yandex Webmaster и submission sitemap выполняются после production deployment. Подробный порядок: `docs/SEO-LAUNCH.md`.

## Принципы

- CMS является источником редакторского контента при подключённой БД;
- перевод не создаёт второй продукт/проект — локализуются только строки;
- декоративные дорожные схемы — design system, а не CMS-content;
- demo-контент всегда явно маркируется и не индексируется как реальное внедрение;
- цены и неподтверждённые корпоративные факты не публикуются автоматически;
- legacy-документ в открытом архиве не означает автоматически, что он является действующей нормативной/технической редакцией;
- binary storage не привязан к провайдеру до production hosting;
- права проверяются сервером;
- preview не должен попадать в поисковый индекс;
- slug опубликованной страницы нельзя менять без 301;
- SEO не гарантирует позиции или сроки индексации.
