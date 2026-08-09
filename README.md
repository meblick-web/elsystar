# ELSYSTAR Platform

Новая web-платформа ELSYSTAR: публичный сайт, административная панель, каталог продукции, решения, проекты, корпоративный контент, документация, обращения, медиатека, SEO и собственная продуктовая аналитика.

## Текущий baseline

`v0.2.0-beta.1 — Security & Operations`

### Реализовано

- плотная светлая B2B design system с тематическими дорожными/ITS-фонами;
- responsive public/admin UI, loading/error/404 и `prefers-reduced-motion`;
- PostgreSQL/CMS является источником истины для редакторского контента;
- главная CMS, каталог продукции, решения, проекты, Corporate Content, FAQ, документация и медиатека;
- explicit demo-project flag и до трёх редактируемых KPI;
- `/content-qa` для поиска пробелов в изображениях, описаниях, KPI, документации и корпоративных данных;
- иерархические категории, характеристики, преимущества, комплектации и product relations;
- Documentation & Software Center с сериями, текущими/архивными версиями, release notes и SHA-256;
- аналитика посетителей, сессий, просмотров, источников, устройств, товаров, скачиваний, заявок и конверсии;
- пользователи админки и роли `ADMIN / EDITOR / SUPPORT / ANALYST`;
- серверный RBAC на admin routes и повторная проверка прав в mutating actions;
- DB-backed admin sessions отзываются при деактивации пользователя или смене роли;
- HMAC-signed admin cookie, 8h TTL, HttpOnly, SameSite Strict, Secure `__Host-` cookie в HTTPS/Codespaces/production;
- PostgreSQL-backed rate limiting login/leads/analytics без хранения plaintext IP в rate-limit storage;
- commercial lead honeypot и validation/payload limits публичных API;
- CSP, frame protection, `nosniff`, Referrer Policy, Permissions Policy и production HSTS;
- allowlist validation внешних media/document URL, MIME, filename и size metadata;
- public/admin `/api/health`;
- PostgreSQL custom-format backup + SHA-256 и guarded restore;
- production security preflight `npm run security:check`;
- журнал административных действий;
- SEO metadata/redirect foundation уже существует; полноценная индексация и internet visibility запланированы на `beta.2`;
- GitHub Codespaces: Node.js 22 + PostgreSQL 16 + автоматический запуск public/admin, guarded Prisma push и content bootstraps.

## Security & Operations

Полный runbook: `docs/OPERATIONS.md`.

Основные команды:

```bash
npm run security:check
npm run db:backup
ELSYSTAR_RESTORE_CONFIRM=YES npm run db:restore -- /path/to/elsystar.dump
```

Production security gate:

```bash
NODE_ENV=production npm run security:check
```

## GitHub Codespaces

Репозиторий содержит `.devcontainer/devcontainer.json` и готов для облачной разработки без локального ПК.

При создании/запуске Codespace автоматически:

1. поднимается PostgreSQL 16;
2. при первом создании выполняется `npm install`;
3. старые preview-процессы останавливаются;
4. очищается revision-dependent `.next` state;
5. генерируется Prisma Client;
6. безопасно синхронизируется development-схема БД;
7. импортируется отсутствующий visible content и выполняются одноразовые content migrations;
8. Next.js запускается на внутренних портах `16300/16301`;
9. локальный preview-proxy публикует пользовательские `6300/6301` и нормализует reverse-proxy headers;
10. внутренние порты остаются служебными.

Обновление текущего Codespace:

```bash
git pull && bash .devcontainer/start-preview.sh
```

Preview credentials являются только development credentials и не должны использоваться в production.

## Структура

- `apps/web` — публичный сайт, локально `http://localhost:6300`
- `apps/admin` — административная панель, локально `http://localhost:6301`
- `packages/database` — Prisma/PostgreSQL, rate limit storage и content bootstrap scripts
- `packages/analytics` — контракты аналитики
- `packages/shared` — общие типы
- `.devcontainer` — GitHub Codespaces environment
- `scripts` — security preflight, backup/restore
- `docs` — архитектура, runbooks, источники контента и release notes

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

## Работа с БД

```bash
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:backup
```

Bootstrap-доступ задаётся через `ADMIN_EMAIL`, `ADMIN_PASSWORD` и `ADMIN_SESSION_SECRET`; после создания DB-пользователей он остаётся только recovery-механизмом. Для rate-limit HMAC задайте отдельный `SECURITY_HASH_SECRET`.

## Проверки

```bash
npm audit --omit=dev --audit-level=high
npm run security:check
npm run db:generate
npm run typecheck
npm run build
```

CI дополнительно проверяет Docker Compose, Codespaces scripts, guarded Prisma push, content bootstraps, security preflight и backup/restore shell scripts.

## Принципы

- публичная часть остаётся лёгкой; сложность управления живёт в отдельной админке;
- нет универсального page builder, способного разрушить дизайн;
- CMS является единственным источником редакторского контента при подключённой БД;
- декоративные дорожные схемы/сетки являются частью design system, а не CMS-контентом;
- demo-контент всегда явно помечается и не выдаётся за фактическое внедрение;
- непроверенные корпоративные факты не публикуются автоматически;
- binary storage не привязан к провайдеру до выбора production hosting;
- права проверяются сервером, а не только интерфейсом;
- публичные abuse controls используют DB-backed rate limit;
- backup/restore и production preflight являются частью release process;
- public и admin используют единую модель данных.
