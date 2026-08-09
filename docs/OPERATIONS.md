# ELSYSTAR — Security & Operations Runbook

Baseline: `v0.2.0-beta.1 — Security & Operations`

## Контуры

- Public Web: `apps/web`, development port `6300`.
- Admin: `apps/admin`, development port `6301`.
- PostgreSQL: единый источник CMS, заявок, аналитики, пользователей, audit и rate-limit buckets.
- Binary storage пока не привязан к провайдеру: MediaAsset/Document хранят URL и проверенные метаданные. Реальный upload/storage подключается на production-этапе.

## RBAC

| Раздел | ADMIN | EDITOR | SUPPORT | ANALYST |
|---|---:|---:|---:|---:|
| Пользователи | ✓ | — | — | — |
| Audit | ✓ | — | — | — |
| Аналитика | ✓ | — | — | ✓ |
| Главная / товары / решения / проекты | ✓ | ✓ | — | — |
| Компания / Content QA / Media / SEO | ✓ | ✓ | — | — |
| Документация | ✓ | ✓ | ✓ | — |
| Заявки | ✓ | — | ✓ | — |

Права проверяются на уровне admin route guard и повторно внутри изменяющих Server Actions/Route Handlers. DB-пользователь с отключённым аккаунтом или изменённой ролью должен войти заново.

## Admin session

- HMAC-SHA256 signed cookie.
- TTL: 8 часов.
- HttpOnly, SameSite=Strict, Priority=High.
- HTTPS/Codespaces/production использует cookie `__Host-elsystar_admin_session` с Secure и Path=/.
- `ADMIN_SESSION_SECRET` должен быть не короче 32 случайных символов.
- Bootstrap login через `ADMIN_EMAIL` / `ADMIN_PASSWORD` — аварийный recovery-механизм; production credentials не должны совпадать с Codespaces preview values.

## Rate limiting

Rate limiting хранится в PostgreSQL, ключ клиента хранится только в виде hash/HMAC.

- Admin login: 5 попыток / 15 минут для комбинации client + email.
- Commercial lead: 5 запросов / 10 минут на клиента.
- Analytics ingestion: 300 событий / 10 минут на клиента.
- Просроченные buckets удаляются opportunistically.

Для HMAC установите отдельный `SECURITY_HASH_SECRET` длиной не менее 32 случайных символов.

## Security headers

Public и Admin выставляют CSP и базовые защитные headers:

- `Content-Security-Policy`;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- ограниченный `Permissions-Policy`;
- HSTS в production.

Admin дополнительно отправляет `Cache-Control: no-store`.

## Public input protection

Commercial lead endpoint:

- принимает только JSON;
- ограничивает размер payload;
- проверяет длины полей и email;
- принимает только локальный `sourcePath`;
- содержит honeypot для простых form bots;
- применяет DB-backed rate limit.

Analytics endpoint имеет whitelist событий, ограничение payload/полей и отдельный rate limit.

## Media / Documents

В beta.1 валидируются именно URL и metadata, поскольку binary upload ещё не подключён.

- URL: только `http://` / `https://`, без embedded credentials;
- блокируются `javascript:`, `data:` и другие схемы;
- MIME ограничен allowlist;
- filename очищается от path components и CR/LF;
- metadata file size ограничен 250 MiB;
- SHA-256 документа остаётся отдельным проверяемым полем.

При подключении реального storage в production дополнительно потребуются проверка фактических bytes, MIME sniffing, provider ACL и upload size enforcement.

## Health checks

Public:

```text
GET /api/health
```

Admin:

```text
GET /api/health
```

Admin health не раскрывает secret values — только boolean readiness. При ошибке PostgreSQL health возвращает HTTP 503.

## Security preflight

Development:

```bash
npm run security:check
```

Production gate:

```bash
NODE_ENV=production npm run security:check
```

Production preflight требует:

- `DATABASE_URL`;
- `ADMIN_SESSION_SECRET` >= 32 chars;
- `SECURITY_HASH_SECRET` >= 32 chars;
- HTTPS `NEXT_PUBLIC_SITE_URL`;
- HTTPS `NEXT_PUBLIC_ADMIN_URL`;
- неочевидный bootstrap password, если recovery login оставлен включённым.

## Backup

Создать backup:

```bash
npm run db:backup
```

Или указать путь:

```bash
bash scripts/backup-postgres.sh /secure/path/elsystar.dump
```

Скрипт:

- использует PostgreSQL custom format;
- создаёт файл с `umask 077`;
- валидирует archive через `pg_restore --list`;
- создаёт sidecar `<backup>.sha256`;
- в Codespaces может использовать PostgreSQL Docker service как fallback.

Backup-файлы исключены из Git.

## Restore

Restore является разрушительной административной операцией и требует явного подтверждения:

```bash
ELSYSTAR_RESTORE_CONFIRM=YES npm run db:restore -- /secure/path/elsystar.dump
```

или:

```bash
ELSYSTAR_RESTORE_CONFIRM=YES bash scripts/restore-postgres.sh /secure/path/elsystar.dump
```

Перед restore:

1. сохранить отдельный backup текущей БД;
2. проверить SHA-256 исходного архива;
3. остановить writes/maintenance window в production;
4. выполнить restore;
5. перезапустить приложения;
6. проверить `/api/health`, admin login, каталог, CMS и формы;
7. проверить audit и последние заявки.

## Codespaces

Codespaces остаётся development/preview средой. Preview credentials из `.devcontainer/docker-compose.yml` не являются production secrets.

Обновление текущего Codespace:

```bash
git pull && bash .devcontainer/start-preview.sh
```

Startup выполняет Prisma generate, guarded db push, content bootstraps и затем перезапускает web/admin preview.

## Production checklist

До переключения реального домена:

- [ ] production PostgreSQL создан отдельно от Codespaces;
- [ ] secrets сгенерированы и не находятся в Git;
- [ ] `NODE_ENV=production npm run security:check` проходит;
- [ ] site/admin URLs используют HTTPS;
- [ ] backup создан и тестовый restore проверен;
- [ ] health checks подключены к monitoring;
- [ ] bootstrap recovery login либо защищён уникальными credentials, либо выключен после создания DB-admin;
- [ ] реальный binary storage настроен с MIME/size/ACL policy;
- [ ] SEO/redirect/indexing выполнены в `beta.2` до switch домена.
