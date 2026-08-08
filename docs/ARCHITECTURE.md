# Architecture

## Контуры

### Public Web
SEO-ориентированный сайт ELSYSTAR: главная, продукция, решения, «Мегаполис», проекты, документация, компания и контакты.

### Admin
Отдельный административный контур: dashboard, каталог, документы, контент, обращения, аналитика, SEO, пользователи и audit log.

### Shared packages
Общие контракты не должны дублироваться между приложениями. База данных и аналитика подключаются через отдельные пакеты.

## План данных

Основные сущности: `ProductCategory`, `Product`, `ProductSpecification`, `MediaAsset`, `Document`, `DocumentVersion`, `Solution`, `ProjectCase`, `Lead`, `AnalyticsEvent`, `AdminUser`, `AuditLog`, `Redirect`.

## Аналитика

События первого класса: `page_view`, `product_view`, `document_download`, `cta_click`, `lead_submit`, `phone_click`, `email_click`.

Хранение сырых персональных данных в аналитике не является целью. Для отчётов предпочтительна агрегированная статистика и минимизация идентификаторов.

## Деплой

Приложения допускают независимый деплой (`elsystar.com` и `admin.elsystar.com`) при общей PostgreSQL БД. В локальной разработке используются порты 6300 и 6301.
