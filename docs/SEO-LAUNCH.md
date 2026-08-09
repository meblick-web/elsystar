# ELSYSTAR — SEO & Search Visibility Runbook

Baseline: `v0.2.0-beta.2 — SEO, Migration & Internet Visibility`

## Canonical domain

Целевой canonical host: `https://elsystar.com`.

На production:

```env
NEXT_PUBLIC_SITE_URL=https://elsystar.com
SEO_INDEXING_ENABLED=true
```

`www.elsystar.com` должен перенаправляться на canonical host постоянным 301 на уровне hosting / reverse proxy. Preview/Codespaces никогда не включают `SEO_INDEXING_ENABLED=true`.

## До включения индексации

1. Production должен отвечать по HTTPS.
2. Выполнить `npm run security:check`.
3. Выполнить `npm run seo:check`.
4. Применить БД и выполнить `npm run seo:bootstrap`.
5. Проверить `/robots.txt`.
6. Проверить `/sitemap.xml`.
7. Проверить canonical на главной, каталоге и нескольких detail pages.
8. Проверить 301 старых URL.
9. Убедиться, что demo-проекты имеют `noindex` и отсутствуют в sitemap.
10. Убедиться, что admin host закрыт `noindex` + `Disallow: /`.

## Подтверждённые legacy redirects

| Старый URL | Новый URL | Причина |
|---|---|---|
| `/index.html` | `/` | Главная |
| `/production.html` | `/production` | Производство |
| `/support.html` | `/support` | Техническая документация |
| `/software.html` | `/solutions/megapolis` | АСУДТ «Мегаполис» |
| `/price.html` | `/products` | Старые комплектации/прайс перенаправляются в актуальный каталог |

Старые URL не удаляются молча: они создаются как `RedirectRule` и видны в `/seo` админки.

## Google Search Console

После переключения реального домена:

1. Добавить domain property `elsystar.com` (предпочтительно DNS verification) либо URL-prefix property.
2. При meta verification задать `GOOGLE_SITE_VERIFICATION`.
3. Отправить `https://elsystar.com/sitemap.xml`.
4. Проверить главную, `/products`, `/solutions/megapolis`, `/support` через URL Inspection.
5. Запросить индексацию ключевых страниц после подтверждения корректных canonical/redirects.
6. Контролировать Page indexing, Core Web Vitals и 404/redirect issues после миграции.

## Yandex Webmaster

После переключения домена:

1. Добавить `https://elsystar.com` в Яндекс Вебмастер.
2. Подтвердить права DNS/файлом/meta; для meta можно использовать `YANDEX_SITE_VERIFICATION`.
3. Добавить `https://elsystar.com/sitemap.xml`.
4. Проверить robots.txt и ответы ключевых страниц.
5. Отправить ключевые страницы на переобход после миграции.
6. Следить за диагностикой, индексированием и исключёнными страницами.

## Sitemap

Sitemap строится сервером из:

- основных публичных маршрутов;
- опубликованных товаров;
- опубликованных решений;
- опубликованных **реальных** проектов;
- серий документации с публичной текущей версией.

Маршруты с `SeoRoute.indexable=false` исключаются. Demo-проекты исключаются независимо от SEO-записей.

## Structured Data

Реализовано:

- `Organization` + `WebSite` глобально;
- `Product` для карточек продукции без выдуманных Offer/price/review;
- `Service` для решений;
- `Article` для реальных проектов;
- demo-проекты не получают Article JSON-LD.

Structured data не должен содержать непроверенные цены, рейтинги, отзывы, адреса или факты внедрения.

## Социальные превью

Для всех страниц применяется OpenGraph/Twitter metadata. Если у товара/решения/проекта есть реальное CMS-изображение, оно используется в preview; иначе используется общий динамический OpenGraph image ELSYSTAR.

## После запуска

- не менять slug опубликованных страниц без 301;
- не удалять старые redirects без проверки внешних ссылок/индекса;
- следить за `/seo` и `/content-qa`;
- проверять 404 и redirect chains;
- замерять Core Web Vitals уже на production URL, а не в Codespaces;
- не обещать позиции/сроки индексации: поисковые системы принимают решение самостоятельно.
