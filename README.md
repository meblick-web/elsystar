# ELSYSTAR Platform

Новая web-платформа ELSYSTAR: публичный сайт, отдельная административная панель, каталог продукции, решения, проекты, корпоративный контент, документация, обращения, медиатека, SEO и собственная продуктовая аналитика.

## Текущий baseline

`v0.2.0-beta.2 — SEO, Migration & Internet Visibility`

## Реализовано

### Public / CMS
- плотная светлая industrial B2B design system с дорожными/ITS-фонами;
- responsive public/admin UI, loading/error/404 и `prefers-reduced-motion`;
- PostgreSQL/CMS — источник истины для редакторского контента;
- CMS главной, продукции, решений, проектов, компании, FAQ, документации и медиатеки;
- explicit demo-project flag и редактируемые KPI;
- `/content-qa` для пробелов в изображениях, описаниях, KPI, документации и корпоративных данных;
- иерархические категории, характеристики, преимущества, комплектации и product relations;
- Documentation & Software Center с сериями, текущими/архивными версиями, release notes и SHA-256.

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
- runbook `docs/OPERATIONS.md`.

### SEO / Migration / Visibility
- единый canonical origin;
- DB-overridable title/description/canonical/index/follow;
- OpenGraph + Twitter metadata;
- общий динамический OpenGraph image;
- Google/Yandex verification meta через environment;
- `/robots.txt` и CMS-driven `/sitemap.xml`;
- Codespaces/preview закрыты от индексации независимо от robots CMS;
- admin всегда `noindex,nofollow` + `Disallow: /`;
- sitemap включает опубликованные товары, решения, реальные проекты и актуальную публичную документацию;
- demo-проекты всегда `noindex` и исключены из sitemap;
- Organization + WebSite JSON-LD;
- Product JSON-LD без выдуманных цен/Offer/reviews;
- Service JSON-LD для решений;
- Article JSON-LD только для реальных проектов;
- legacy 301 bootstrap для старых `.html` URL;
- SEO readiness dashboard в админке;
- `npm run seo:check` и hard-coded internal link validation;
- public ISR/revalidate вместо глобального force-dynamic;
- `X-Powered-By` отключён, compression включён;
- launch runbook `docs/SEO-LAUNCH.md`.

## GitHub Codespaces

Codespaces поднимает Node.js 22 + PostgreSQL 16 и запускает:

- public proxy: `6300`;
- admin proxy: `6301`;
- внутренние Next.js ports `16300/16301` остаются служебными.

При запуске автоматически:

1. генерируется Prisma Client;
2. синхронизируется development DB schema;
3. импортируется отсутствующий visible content;
4. выполняются content migrations;
5. применяются beta2 SEO defaults и legacy redirects;
6. public/admin перезапускаются на текущей revision;
7. search indexing принудительно остаётся выключенным для preview.

Обновление текущего Codespace:

```bash
git pull && bash .devcontainer/start-preview.sh
```

## Структура

- `apps/web` — публичный Next.js сайт;
- `apps/admin` — отдельная Next.js админка;
- `packages/database` — Prisma/PostgreSQL, rate-limit storage, content/SEO bootstrap scripts;
- `packages/analytics` — контракты аналитики;
- `packages/shared` — общие типы;
- `.devcontainer` — Codespaces environment;
- `scripts` — security/SEO preflight, link checks, backup/restore;
- `docs` — architecture/runbooks/release notes.

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

## Команды

```bash
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:backup
npm run seo:bootstrap
npm run security:check
npm run seo:check
npm run typecheck
npm run build
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

## CI

CI выполняет:

```text
npm install
→ production dependency audit
→ security preflight
→ SEO preflight + internal link check
→ Prisma generate
→ TypeScript
→ public/admin production build
→ security/operations script validation
→ Codespaces/bootstrap validation
```

## Принципы

- CMS является единственным источником редакторского контента при подключённой БД;
- декоративные дорожные схемы — design system, а не CMS-content;
- demo-контент всегда явно маркируется и не индексируется как реальное внедрение;
- непроверенные корпоративные факты, цены, рейтинги и отзывы не публикуются автоматически;
- binary storage не привязан к провайдеру до production hosting;
- права проверяются сервером;
- preview не должен попадать в поисковый индекс;
- slug опубликованной страницы нельзя менять без 301;
- SEO не гарантирует позиции или сроки индексации.
