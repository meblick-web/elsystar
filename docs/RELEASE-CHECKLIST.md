# ELSYSTAR Release Checklist

Этот checklist не привязан к конкретному hosting provider.

## 1. Before deployment

- `npm install`
- `npm audit --omit=dev --audit-level=high`
- `npm run db:generate`
- `npm run security:check`
- `npm run seo:check`
- `npm run release:check`
- `npm run typecheck`
- `npm run build`
- `npm run smoke:production`

## 2. Required production environment

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL` — public HTTPS origin
- `NEXT_PUBLIC_ADMIN_URL` — admin HTTPS origin
- `ADMIN_SESSION_SECRET` — unique random value, minimum 32 characters
- `SECURITY_HASH_SECRET` — separate unique random value, minimum 32 characters
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` only for initial/recovery bootstrap when required
- `SEO_INDEXING_ENABLED=false` until the real domain is verified and ready

Never commit secrets to GitHub.

## 3. First clean database only

The repository currently has no historical Prisma migration chain because development used guarded `db push` before the first production launch.

For a completely empty PostgreSQL database only:

```bash
ELSYSTAR_PRODUCTION_INIT=YES npm run db:init:production
```

The initializer checks the public schema first. If any tables already exist, it stops without applying schema/content changes.

For any later schema update, prepare and review an explicit migration path. Do not rerun the clean-database initializer.

## 4. Runtime checks

Public:
- `/`
- `/products`
- `/solutions`
- `/projects`
- `/support`
- `/about`
- `/production`
- `/contacts`
- `/faq`
- `/robots.txt`
- `/sitemap.xml`
- `/api/health`

Admin:
- `/login`
- `/api/health`
- `/content-qa`
- `/seo`
- products / solutions / projects save actions

## 5. Content gate

Before enabling indexing:
- resolve critical warnings in Admin → Content QA;
- replace demo projects with verified real projects where possible;
- keep demo project pages `noindex`;
- verify company address/requisites only from confirmed sources;
- verify all document/software download URLs;
- ensure product images have useful alt text;
- verify commercial form recipients/workflow.

## 6. SEO launch gate

Only after the real HTTPS public domain is working:
- set `NEXT_PUBLIC_SITE_URL` to the real canonical domain;
- verify `/robots.txt` and `/sitemap.xml`;
- add Google/Yandex verification if used;
- review legacy redirects;
- set `SEO_INDEXING_ENABLED=true`;
- redeploy;
- then submit sitemap to search engines.

## 7. Backup / rollback

Before changing an existing production database:

```bash
npm run db:backup
```

Keep the generated SHA-256 next to the backup. Restore requires explicit confirmation and must follow `docs/OPERATIONS.md`.

## Known release limitation

English localization is not implemented yet. Any `RU / EN` label found by `npm run release:check` is reported as a warning so the UI cannot be mistaken for a completed bilingual implementation.
