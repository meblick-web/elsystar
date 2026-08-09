import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
const MARKER_ACTION = "content.bootstrap.alpha9_2";
const MARKER_ENTITY = "cms-source-of-truth-v1";

if (!connectionString) {
  console.log("[ELSYSTAR] Content bootstrap skipped: DATABASE_URL is not configured.");
  process.exit(0);
}

const client = new Client({ connectionString });
await client.connect();

const now = new Date();

async function one(sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0] ?? null;
}

async function ensureProduct({ id, slug, model, name, shortDescription, description, categoryId, featured, sortOrder }) {
  const inserted = await one(`
    INSERT INTO "Product" (
      "id", "slug", "model", "name", "shortDescription", "description", "status", "featured", "sortOrder", "categoryId", "createdAt", "updatedAt"
    ) VALUES ($1,$2,$3,$4,$5,$6,'PUBLISHED',$7,$8,$9,$10,$10)
    ON CONFLICT ("slug") DO NOTHING
    RETURNING "id"
  `, [id, slug, model, name, shortDescription, description, featured, sortOrder, categoryId, now]);

  return inserted?.id ?? (await one(`SELECT "id" FROM "Product" WHERE "slug"=$1`, [slug]))?.id;
}

async function seedProductDetails(productId, code) {
  if (!productId) return;
  const specCount = Number((await one(`SELECT COUNT(*)::int AS count FROM "ProductSpecification" WHERE "productId"=$1`, [productId]))?.count ?? 0);
  const featureCount = Number((await one(`SELECT COUNT(*)::int AS count FROM "ProductFeature" WHERE "productId"=$1`, [productId]))?.count ?? 0);
  const mediaCount = Number((await one(`SELECT COUNT(*)::int AS count FROM "MediaAsset" WHERE "productId"=$1 AND "type"='IMAGE'`, [productId]))?.count ?? 0);

  const catalog = {
    uk41: {
      specs: [
        ["Число фаз движения", "16", null],
        ["Число направлений", "16", null],
        ["Фиксированные программы", "16", null],
        ["Силовые каналы", "32", null],
        ["Максимальный ток канала", "5", "А"],
        ["Интерфейсы", "RS-232, RS-485", null],
      ],
      features: [
        ["Локальная и сетевая работа", "Работа автономно или в составе централизованной системы управления."],
        ["Диагностика", "Контроль состояния, конфликтов и ведение электронного журнала."],
        ["Гибкая связь", "Поддержка проводных, радиоканальных и GPRS-сценариев связи."],
      ],
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=86",
      title: "УК-4.1М — оборудование и электронные модули",
    },
    uk25: {
      specs: [
        ["Число фаз", "до 4", null],
        ["Число направлений", "до 8", null],
        ["Силовые каналы", "16", null],
      ],
      features: [
        ["Для объектов меньшей сложности", "Рациональная конфигурация для перекрёстков с меньшим числом направлений и фаз."],
        ["Сетевая интеграция", "Поддерживает использование в составе общей системы управления."],
      ],
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=86",
      title: "УК-2.5 — контроллер дорожного движения",
    },
  }[code];

  if (!catalog) return;

  if (!specCount) {
    for (let i = 0; i < catalog.specs.length; i += 1) {
      const [label, value, unit] = catalog.specs[i];
      await client.query(`
        INSERT INTO "ProductSpecification" ("id","productId","label","value","unit","sortOrder","createdAt","updatedAt")
        VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
        ON CONFLICT ("id") DO NOTHING
      `, [`bootstrap-${code}-spec-${i + 1}`, productId, label, value, unit, i, now]);
    }
  }

  if (!featureCount) {
    for (let i = 0; i < catalog.features.length; i += 1) {
      const [title, description] = catalog.features[i];
      await client.query(`
        INSERT INTO "ProductFeature" ("id","productId","title","description","sortOrder","createdAt","updatedAt")
        VALUES ($1,$2,$3,$4,$5,$6,$6)
        ON CONFLICT ("id") DO NOTHING
      `, [`bootstrap-${code}-feature-${i + 1}`, productId, title, description, i, now]);
    }
  }

  if (!mediaCount) {
    await client.query(`
      INSERT INTO "MediaAsset" (
        "id","title","alt","type","url","storageProvider","productId","isPrimary","sortOrder","createdAt","updatedAt"
      ) VALUES ($1,$2,$3,'IMAGE',$4,'external',$5,true,0,$6,$6)
      ON CONFLICT ("id") DO NOTHING
    `, [`bootstrap-${code}-image`, catalog.title, catalog.title, catalog.image, productId, now]);
  }
}

try {
  const marker = await one(`
    SELECT "id" FROM "AuditLog"
    WHERE "action"=$1 AND "entityType"='System' AND "entityId"=$2
    LIMIT 1
  `, [MARKER_ACTION, MARKER_ENTITY]);

  if (marker) {
    console.log("[ELSYSTAR] CMS visible-content bootstrap already applied; nothing to do.");
    await client.end();
    process.exit(0);
  }

  await client.query("BEGIN");

  await client.query(`
    INSERT INTO "HomepageContent" (
      "id","heroEyebrow","heroTitle","heroDescription","primaryCtaLabel","primaryCtaHref","secondaryCtaLabel","secondaryCtaHref",
      "solutionsEyebrow","solutionsTitle","projectsEyebrow","projectsTitle","supportTitle","supportDescription","updatedAt"
    ) VALUES (
      'homepage','ИНТЕЛЛЕКТУАЛЬНЫЕ ТРАНСПОРТНЫЕ СИСТЕМЫ','Контроллеры и системы управления дорожным движением',
      'Разрабатываем оборудование и программные решения для безопасного и эффективного управления городской транспортной инфраструктурой.',
      'Подобрать решение','/solutions','Каталог продукции','/products','НАПРАВЛЕНИЯ','Всё необходимое для управления движением',
      'ПРОЕКТЫ','Решения, работающие на реальных объектах','Документы и помощь — в одном месте',
      'Быстрый доступ к руководствам, сертификатам, ПО и актуальным версиям материалов.',$1
    ) ON CONFLICT ("id") DO NOTHING
  `, [now]);

  await client.query(`
    INSERT INTO "CorporateContent" (
      "id","companyName","aboutEyebrow","aboutTitle","aboutLead","aboutBody","historyTitle","historyBody",
      "productionEyebrow","productionTitle","productionLead","productionBody","competenciesTitle","supportTitle","supportBody",
      "phonePrimary","phoneSecondary","emailPrimary","legalName","updatedAt"
    ) VALUES (
      'corporate','ООО «Элсистар»','О КОМПАНИИ','Инженерные решения для управления дорожным движением',
      'ООО «Элсистар» — производитель программируемых контроллеров и сервисного оборудования управления дорожным движением.',
      'Компания основана группой разработчиков контроллеров дорожного движения ОАО «Телеавтоматика». Основная продукция — контроллеры и системы автоматизированного управления дорожным движением. Дорожные контроллеры УК-4.1М и УК-2.5 развивают накопленный многолетний опыт разработки и изготовления оборудования.',
      'Опыт разработки и внедрения',
      'АСУДТ «Мегаполис» разрабатывалась и испытывалась компанией в Ростове-на-Дону. На официальном сайте ELSYSTAR указано, что в 2005 году система охватывала 57 перекрёстков, а в 2009 году — 196.',
      'ПРОИЗВОДСТВО','Собственное производство оборудования',
      'Компания располагает собственными производственными мощностями для выпуска дорожных контроллеров и оборудования АСУДД.',
      'Производственное направление включает дорожные контроллеры, модули сопряжения для различных типов контроллеров и модули сбора информации о дорожном движении. ELSYSTAR поставляет как отдельные компоненты и подсистемы АСУДД, так и комплексные решения.',
      'Ключевые компетенции','Техническая поддержка оборудования и ПО',
      'В центре документации доступны руководства, сертификаты, программы для подготовки и загрузки СОД, а также материалы по АСУДТ «Мегаполис».',
      '+7 (967) 423-20-54','8 (86635) 41034','arkhast@mail.ru','ООО «Элсистар»',$1
    ) ON CONFLICT ("id") DO NOTHING
  `, [now]);

  const competencyCount = Number((await one(`SELECT COUNT(*)::int AS count FROM "CorporateCompetency" WHERE "contentId"='corporate'`))?.count ?? 0);
  if (!competencyCount) {
    const competencies = [
      ["Дорожные контроллеры", "Разработка и производство программируемых контроллеров для транспортных и пешеходных потоков."],
      ["АСУДТ «Мегаполис»", "Централизованное управление, мониторинг, координация и диспетчеризация дорожной сети."],
      ["Модули и периферия АСУДД", "Модули сопряжения и сбора информации о дорожном движении для интеграции объектов."],
      ["Программное обеспечение и интеграция", "Модульная программная архитектура и интерфейсы для связи с внешними системами."],
    ];
    for (let i = 0; i < competencies.length; i += 1) {
      await client.query(`
        INSERT INTO "CorporateCompetency" ("id","contentId","title","description","sortOrder","createdAt","updatedAt")
        VALUES ($1,'corporate',$2,$3,$4,$5,$5) ON CONFLICT ("id") DO NOTHING
      `, [`bootstrap-competency-${i + 1}`, competencies[i][0], competencies[i][1], i, now]);
    }
  }

  const faqCount = Number((await one(`SELECT COUNT(*)::int AS count FROM "FaqEntry"`))?.count ?? 0);
  if (!faqCount) {
    const faq = [
      ["Где скачать руководства и сертификаты?", "Актуальные руководства, сертификаты и другие технические материалы собраны в разделе «Документация». Для серий документов доступна история версий."],
      ["Где получить программное обеспечение и прошивки?", "Опубликованные программы, прошивки и сопроводительные материалы доступны в центре документации. Если нужной версии нет в открытом доступе, свяжитесь с технической поддержкой."],
      ["Как запросить коммерческое предложение?", "Используйте форму «Получить КП» на сайте и опишите объект, требуемое оборудование или задачу. Заявка попадёт в коммерческий контур ELSYSTAR."],
    ];
    for (let i = 0; i < faq.length; i += 1) {
      await client.query(`
        INSERT INTO "FaqEntry" ("id","question","answer","active","sortOrder","createdAt","updatedAt")
        VALUES ($1,$2,$3,true,$4,$5,$5) ON CONFLICT ("id") DO NOTHING
      `, [`bootstrap-faq-${i + 1}`, faq[i][0], faq[i][1], i, now]);
    }
  }

  await client.query(`
    INSERT INTO "ProductCategory" ("id","slug","name","description","sortOrder","createdAt","updatedAt")
    VALUES ('bootstrap-category-road-controllers','road-controllers','Дорожные контроллеры','Контроллеры для управления светофорными объектами.',0,$1,$1)
    ON CONFLICT ("slug") DO NOTHING
  `, [now]);
  const categoryId = (await one(`SELECT "id" FROM "ProductCategory" WHERE "slug"='road-controllers'`))?.id;

  const uk41 = await ensureProduct({
    id: "bootstrap-product-uk-4-1m", slug: "uk-4-1m", model: "УК-4.1М", name: "Дорожный контроллер УК-4.1М",
    shortDescription: "Универсальный дорожный контроллер для локального и сетевого управления регулируемыми перекрёстками.",
    description: "Контроллер предназначен для управления транспортными и пешеходными потоками и может работать как автономно, так и в составе АСУДТ.",
    categoryId, featured: true, sortOrder: 10,
  });
  const uk25 = await ensureProduct({
    id: "bootstrap-product-uk-2-5", slug: "uk-2-5", model: "УК-2.5", name: "Дорожный контроллер УК-2.5",
    shortDescription: "Компактный контроллер для локального и сетевого управления транспортными потоками и пешеходами.",
    description: "Модель предназначена для светофорных объектов меньшей сложности и совместима с ранее применявшимися решениями семейства УК-2.",
    categoryId, featured: true, sortOrder: 20,
  });
  await seedProductDetails(uk41, "uk41");
  await seedProductDetails(uk25, "uk25");

  const solutions = [
    ["bootstrap-solution-intersection","intersection-control","Управление перекрёстками","Локальное и сетевое управление светофорными объектами с диагностикой и контролем конфликтов.","SOLUTION",true,10,"https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1400&q=86"],
    ["bootstrap-solution-megapolis","megapolis","АСУДТ «Мегаполис»","Централизованный мониторинг, диспетчеризация и управление городской сетью дорожных объектов.","PLATFORM",true,20,"https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=86"],
    ["bootstrap-solution-modernization","modernization","Модернизация объектов","Переход на современное оборудование и программное управление без ненужной замены всей инфраструктуры.","SOLUTION",true,30,"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=86"],
  ];
  for (const solution of solutions) {
    await client.query(`
      INSERT INTO "Solution" ("id","slug","name","shortDescription","type","status","featured","sortOrder","imageUrl","createdAt","updatedAt")
      VALUES ($1,$2,$3,$4,$5,'PUBLISHED',$6,$7,$8,$9,$9)
      ON CONFLICT ("slug") DO NOTHING
    `, [...solution, now]);
  }

  const projects = [
    {
      id:"bootstrap-project-nalchik", slug:"demo-nalchik-smart-traffic", title:"Демо-кейс: интеллектуальная транспортная система Нальчика", city:"Нальчик", region:"Кабардино-Балкария", year:2026, featured:true, sortOrder:10,
      summary:"Демонстрационный сценарий комплексной модернизации городских перекрёстков с адаптивным управлением, мониторингом и диспетчеризацией.",
      challenge:"Смоделировать модернизацию загруженных городских перекрёстков без полной замены существующей инфраструктуры, объединить контроллеры и детекторы в единую систему и дать диспетчеру прозрачный мониторинг состояния объектов.",
      solution:"В демонстрационном проекте применены дорожные контроллеры ELSYSTAR, детекторы транспорта, централизованный мониторинг и сценарии адаптивного управления. Объекты объединены в единый контур с журналом событий и удалённой диагностикой.",
      result:"Расчётный эффект демонстрационного сценария: 42 перекрёстка, 126 контроллеров; снижение средней задержки до 18%, сокращение числа остановок до 14% и более быстрый поиск неисправностей за счёт единого мониторинга.",
      image:"https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1600&q=88",
    },
    {
      id:"bootstrap-project-pyatigorsk", slug:"demo-pyatigorsk-coordinated-control", title:"Демо-кейс: координированное управление Пятигорска", city:"Пятигорск", region:"Ставропольский край", year:2026, featured:true, sortOrder:20,
      summary:"Демонстрационный проект для курортного города: координация магистралей, приоритет общественного транспорта и централизованный контроль.",
      challenge:"Показать работу системы на городе с сезонной нагрузкой, переменной интенсивностью движения и необходимостью поддерживать предсказуемое время проезда по основным коридорам.",
      solution:"Сценарий включает координированные планы, сетевое управление контроллерами, сбор данных с детекторов и диспетчерскую панель для контроля режимов и событий.",
      result:"Модельный результат: 28 перекрёстков, 84 контроллера; до 16% сокращения времени прохождения основного коридора и более стабильное распределение транспортного потока в часы пик.",
      image:"https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1600&q=88",
    },
    {
      id:"bootstrap-project-minvody", slug:"demo-minvody-transport-hub", title:"Демо-кейс: транспортный узел Минеральных Вод", city:"Минеральные Воды", region:"Ставропольский край", year:2026, featured:true, sortOrder:30,
      summary:"Демонстрационный сценарий управления светофорными объектами вокруг транспортного узла с мониторингом и удалённой диагностикой.",
      challenge:"Смоделировать работу сети на транспортном узле с резкими пиками нагрузки, транзитным потоком и повышенными требованиями к доступности оборудования.",
      solution:"В сценарии используются контроллеры, резервируемые каналы связи, транспортные детекторы и централизованный журнал событий с оперативным контролем состояния каждого объекта.",
      result:"Расчётный эффект: 24 объекта, 72 контроллера; до 20% снижения пиковых очередей и сокращение времени диагностики оборудования благодаря единому центру мониторинга.",
      image:"https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=88",
    },
    {
      id:"bootstrap-project-krasnodar", slug:"demo-krasnodar-urban-its", title:"Демо-кейс: городской контур ИТС Краснодара", city:"Краснодар", region:"Краснодарский край", year:2026, featured:false, sortOrder:40,
      summary:"Расширенный демонстрационный кейс городской ИТС с адаптивным управлением, диспетчеризацией и аналитикой событий.",
      challenge:"Показать архитектуру масштабируемой городской системы, которая объединяет десятки объектов и позволяет постепенно добавлять новые контроллеры, детекторы и подсистемы без остановки действующей сети.",
      solution:"Проектная модель объединяет локальные контроллеры, телеметрию, централизованный сервер, операторские рабочие места и единый журнал событий. Архитектура рассчитана на поэтапное расширение.",
      result:"Демонстрационные KPI: 60+ объектов, 180 контроллеров и мониторинг 24/7; единая наблюдаемость сети, сокращение ручных операций диспетчера и централизованное изменение планов управления.",
      image:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=88",
    },
  ];
  for (const project of projects) {
    await client.query(`
      INSERT INTO "Project" (
        "id","slug","title","summary","city","region","year","challenge","solutionText","result","coverImageUrl","status","featured","sortOrder","createdAt","updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PUBLISHED',$12,$13,$14,$14)
      ON CONFLICT ("slug") DO NOTHING
    `, [project.id, project.slug, project.title, project.summary, project.city, project.region, project.year, project.challenge, project.solution, project.result, project.image, project.featured, project.sortOrder, now]);
  }

  await client.query(`
    INSERT INTO "AuditLog" ("id","actorEmail","action","entityType","entityId","payload","createdAt")
    VALUES ('bootstrap-cms-source-v1','system@elsystar.local',$1,'System',$2,$3::jsonb,$4)
    ON CONFLICT ("id") DO NOTHING
  `, [MARKER_ACTION, MARKER_ENTITY, JSON.stringify({ imported: ["homepage","corporate","competencies","faq","products","solutions","demoProjects"] }), now]);

  await client.query("COMMIT");
  console.log("[ELSYSTAR] Visible public content imported into CMS database.");
} catch (error) {
  try { await client.query("ROLLBACK"); } catch {}
  console.error("[ELSYSTAR] Visible-content bootstrap failed:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
