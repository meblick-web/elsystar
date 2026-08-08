# ELSYSTAR Platform

Новая web-платформа ELSYSTAR: публичный сайт, административная панель, управляемый каталог продукции, документация, обращения и собственная продуктовая аналитика.

## Текущий baseline

`v0.1.0-alpha.2 — Admin Auth, Catalog Core & Real Analytics Foundation`

### Реализовано

- лёгкая адаптивная главная ELSYSTAR;
- отдельная административная панель;
- bootstrap-авторизация администратора через защищённую HttpOnly-сессию;
- PostgreSQL + Prisma 7 data layer;
- сущности продуктов, категорий, характеристик, документов, заявок, пользователей, аналитики и audit log;
- добавление и редактирование продукции;
- структурированные технические характеристики;
- статусы `Черновик / Опубликован / Архив`;
- базовые SEO-поля продукта;
- реальные события `page_view`, `product_view`, `document_download`, `cta_click`, `lead_submit`, `phone_click`, `email_click`;
- dashboard показывает реальные данные или честное состояние «БД не подключена».

## Структура

- `apps/web` — публичный сайт, локально `http://localhost:6300`
- `apps/admin` — административная панель, локально `http://localhost:6301`
- `packages/ui` — общий UI foundation
- `packages/database` — Prisma/PostgreSQL, схема и data runtime
- `packages/analytics` — контракты событий аналитики
- `packages/shared` — общие типы и контракты
- `docs` — архитектура и roadmap

## Локальный запуск

```bash
cp .env.example .env
npm install
npm run db:push
npm run dev:web
```

Во втором терминале:

```bash
npm run dev:admin
```

Перед запуском замените в `.env` значения `ADMIN_EMAIL`, `ADMIN_PASSWORD` и `ADMIN_SESSION_SECRET`.

## Работа с БД

```bash
npm run db:generate
npm run db:push
npm run db:migrate
```

## Проверки

```bash
npm run typecheck
npm run build
# или
npm run validate
```

## Принципы

- публичная часть остаётся лёгкой и быстрой;
- сложность управления переносится в отдельную админ-панель;
- технические характеристики продукции хранятся структурированно, а не в HTML-тексте;
- документы и прошивки версионируются;
- аналитика строится вокруг полезных бизнес-событий, а не сотен vanity-метрик;
- публичный сайт и админка используют единую модель данных.
