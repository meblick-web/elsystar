# ELSYSTAR RU / EN localization

## URL model

- Russian is the default locale: `/`, `/products`, `/solutions`, ...
- English uses the `/en` prefix: `/en`, `/en/products`, `/en/solutions`, ...
- Product, solution, project and documentation slugs remain the same in both locales.

This avoids duplicate business entities. Publication status, media, relations, product model and technical identity remain shared; only editorial strings are localized.

## Translation storage

English editorial strings are stored in `ContentTranslation`:

- `locale`
- `entityType`
- `entityId`
- `field`
- `value`

The unique key is `(locale, entityType, entityId, field)`.

Examples:

- `en / Product / uk-4-1m / shortDescription`
- `en / Solution / megapolis / name`
- `en / HomepageContent / homepage / heroTitle`

## Administration

Use `/localization` in ELSYSTAR Admin. The route is available only to `ADMIN` and `EDITOR` roles.

The editor can:

- search English strings;
- filter by entity type;
- update a translation inline;
- remove a translation;
- create an explicit translation by entity type, entity id/slug and field.

Every create/update/delete is written to the audit log.

## Bootstrap behavior

`packages/database/scripts/bootstrap-localization-beta4.mjs` inserts initial verified English copy for the current ELSYSTAR content.

It uses `ON CONFLICT DO NOTHING`. Therefore a translation edited in Admin is **never overwritten** by a later Codespaces restart or bootstrap run.

The bootstrap is executed:

- after development schema sync in Codespaces;
- during guarded initialization of a completely clean production database.

## SEO behavior

English pages emit:

- their own canonical `/en/...` URL;
- `hreflang` alternates for Russian and English;
- English OpenGraph metadata.

Dynamic English entries are added to `sitemap.xml` only when an explicit English translation exists for the entity's primary name/title field.

Demo projects remain excluded from indexable project-detail SEO, regardless of locale.

## Content rules

- Never translate an unverified company fact into a new factual claim.
- Product model identifiers such as `UK-4.1M` and `UK-2.5` are identifiers, not marketing translations.
- Technical numbers must match the Russian source-of-truth data.
- Missing English editorial content should be completed in Admin rather than fabricated in the public component.
- Russian source content remains authoritative until a reviewed English translation is saved.
