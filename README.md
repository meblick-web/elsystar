# ELSYSTAR Platform

Новая web-платформа ELSYSTAR: публичный сайт, административная панель, каталог продукции, решения, проекты, документация, обращения, медиатека, SEO и собственная продуктовая аналитика.

## Текущий baseline

`v0.1.0-alpha.5 — Analytics, Users, Audit & SEO Operations`

### Реализовано

- лёгкая адаптивная публичная часть;
- отдельная административная панель;
- PostgreSQL + Prisma 7 data layer;
- каталог продукции и структурированные технические характеристики;
- документация, заявки и provider-neutral медиатека;
- CMS главной страницы, решения/платформы и проекты;
- полноценная аналитика: посетители, сессии, просмотры, источники, устройства, товары, скачивания, заявки и конверсия;
- UTM/source attribution;
- пользователи админки и роли `ADMIN / EDITOR / SUPPORT / ANALYST`;
- salted scrypt password hashes и подписанные HttpOnly-сессии;
- журнал административных действий;
- SEO по маршрутам: title, description, canonical, index/follow;
- управляемые 301/302 redirects для переноса старого сайта.

## Структура

- `apps/web` — публичный сайт, локально `http://localhost:6300`
- `apps/admin` — административная панель, локально `http://localhost:6301`
- `packages/database` — Prisma/PostgreSQL
- `packages/analytics` — контракты событий аналитики
- `packages/shared` — общие типы
- `docs` — архитектура и release notes

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

Для сохранения контента, пользователей, SEO, заявок и аналитики нужен PostgreSQL и `DATABASE_URL`.

## Работа с БД

```bash
npm run db:generate
npm run db:push
npm run db:migrate
```

Bootstrap-доступ задаётся через `ADMIN_EMAIL`, `ADMIN_PASSWORD` и `ADMIN_SESSION_SECRET`; после создания DB-пользователей он остаётся резервным каналом восстановления.

## Проверки

```bash
npm audit --omit=dev --audit-level=high
npm run db:generate
npm run typecheck
npm run build
```

## Принципы

- публичная часть остаётся лёгкой и быстрой;
- сложность управления переносится в отдельную админ-панель;
- нет универсального page builder, способного разрушить дизайн;
- контент хранится в типизированных сущностях;
- файлы и storage не привязаны к конкретному хостингу заранее;
- аналитика строится вокруг полезных бизнес-событий;
- публичный сайт и админка используют единую модель данных.
