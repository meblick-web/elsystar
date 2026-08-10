import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
const MARKER_ACTION = "content.bootstrap.beta5";
const MARKER_ENTITY = "verified-catalog-content-v1";

if (!connectionString) {
  console.log("[ELSYSTAR] beta5 content bootstrap skipped: DATABASE_URL is not configured.");
  process.exit(0);
}

const client = new Client({ connectionString });
await client.connect();
const now = new Date();

async function one(sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0] ?? null;
}

async function ensureCategory({ id, slug, name, description, sortOrder }) {
  await client.query(`
    INSERT INTO "ProductCategory" ("id","slug","name","description","sortOrder","createdAt","updatedAt")
    VALUES ($1,$2,$3,$4,$5,$6,$6)
    ON CONFLICT ("slug") DO NOTHING
  `, [id, slug, name, description, sortOrder, now]);
  return (await one(`SELECT "id" FROM "ProductCategory" WHERE "slug"=$1`, [slug]))?.id ?? null;
}

async function ensureProduct({ id, slug, model, name, shortDescription, description, categoryId, sortOrder }) {
  await client.query(`
    INSERT INTO "Product" ("id","slug","model","name","shortDescription","description","status","featured","sortOrder","categoryId","createdAt","updatedAt")
    VALUES ($1,$2,$3,$4,$5,$6,'PUBLISHED',false,$7,$8,$9,$9)
    ON CONFLICT DO NOTHING
  `, [id, slug, model, name, shortDescription, description, sortOrder, categoryId, now]);
  return (await one(`
    SELECT "id" FROM "Product"
    WHERE "slug"=$1 OR "model"=$2
    ORDER BY CASE WHEN "slug"=$1 THEN 0 ELSE 1 END
    LIMIT 1
  `, [slug, model]))?.id ?? null;
}

async function ensureSpec(productId, id, label, value, unit, sortOrder) {
  if (!productId) return;
  await client.query(`
    INSERT INTO "ProductSpecification" ("id","productId","label","value","unit","sortOrder","createdAt","updatedAt")
    VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
    ON CONFLICT ("id") DO NOTHING
  `, [id, productId, label, value, unit, sortOrder, now]);
}

async function ensureFeature(productId, id, title, description, sortOrder) {
  if (!productId) return;
  await client.query(`
    INSERT INTO "ProductFeature" ("id","productId","title","description","sortOrder","createdAt","updatedAt")
    VALUES ($1,$2,$3,$4,$5,$6,$6)
    ON CONFLICT ("id") DO NOTHING
  `, [id, productId, title, description, sortOrder, now]);
}

async function ensureConfiguration(productId, id, name, description, sku, sortOrder) {
  if (!productId) return;
  await client.query(`
    INSERT INTO "ProductConfiguration" ("id","productId","name","description","sku","sortOrder","createdAt","updatedAt")
    VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
    ON CONFLICT ("id") DO NOTHING
  `, [id, productId, name, description, sku, sortOrder, now]);
}

async function ensureRelation(sourceProductId, targetProductId, id, type, sortOrder) {
  if (!sourceProductId || !targetProductId || sourceProductId === targetProductId) return;
  await client.query(`
    INSERT INTO "ProductRelation" ("id","sourceProductId","targetProductId","type","sortOrder","createdAt")
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT ("sourceProductId","targetProductId","type") DO NOTHING
  `, [id, sourceProductId, targetProductId, type, sortOrder, now]);
}

async function ensureSolution({ id, slug, name, shortDescription, description, type = "SOLUTION", featured = false, sortOrder, imageUrl = null }) {
  await client.query(`
    INSERT INTO "Solution" ("id","slug","name","shortDescription","description","type","status","featured","sortOrder","imageUrl","createdAt","updatedAt")
    VALUES ($1,$2,$3,$4,$5,$6,'PUBLISHED',$7,$8,$9,$10,$10)
    ON CONFLICT ("slug") DO NOTHING
  `, [id, slug, name, shortDescription, description, type, featured, sortOrder, imageUrl, now]);
  await client.query(`UPDATE "Solution" SET "description"=$2, "updatedAt"=$3 WHERE "slug"=$1 AND ("description" IS NULL OR btrim("description")='')`, [slug, description, now]);
  return (await one(`SELECT "id" FROM "Solution" WHERE "slug"=$1`, [slug]))?.id ?? null;
}

async function ensureTranslation(entityType, entityId, field, value) {
  if (!value) return;
  await client.query(`
    INSERT INTO "ContentTranslation" ("id","locale","entityType","entityId","field","value","createdAt","updatedAt")
    VALUES ($1,'en',$2,$3,$4,$5,$6,$6)
    ON CONFLICT ("locale","entityType","entityId","field") DO NOTHING
  `, [`beta5-en-${entityType}-${entityId}-${field}`.replace(/[^A-Za-z0-9_.-]/g, "-"), entityType, entityId, field, value, now]);
}

async function ensureDocumentSeries({ id, slug, title, description, type, language, productId = null, sortOrder = 0, versionId, version, fileUrl, fileName, mimeType = null, releaseDate = null }) {
  await client.query(`
    INSERT INTO "DocumentSeries" ("id","slug","title","description","type","language","productId","sortOrder","createdAt","updatedAt")
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
    ON CONFLICT ("slug") DO NOTHING
  `, [id, slug, title, description, type, language, productId, sortOrder, now]);
  const series = await one(`SELECT "id" FROM "DocumentSeries" WHERE "slug"=$1`, [slug]);
  if (!series?.id) return;
  await client.query(`
    INSERT INTO "Document" (
      "id","title","description","type","fileUrl","fileName","version","language","mimeType","releaseDate","isCurrent","isPublic","publishedAt","sortOrder","seriesId","productId","createdAt","updatedAt"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,true,$11,0,$12,$13,$11,$11)
    ON CONFLICT ("seriesId","version") DO NOTHING
  `, [versionId, title, description, type, fileUrl, fileName, version, language, mimeType, releaseDate, now, series.id, productId]);
}

try {
  const marker = await one(`SELECT "id" FROM "AuditLog" WHERE "action"=$1 AND "entityType"='System' AND "entityId"=$2 LIMIT 1`, [MARKER_ACTION, MARKER_ENTITY]);
  if (marker) {
    console.log("[ELSYSTAR] beta5 verified catalog bootstrap already applied; nothing to do.");
    process.exit(0);
  }

  await client.query("BEGIN");

  const roadControllers = await ensureCategory({ id: "beta5-category-road-controllers", slug: "road-controllers", name: "Дорожные контроллеры", description: "Программируемые контроллеры для локального и сетевого управления светофорными объектами.", sortOrder: 10 });
  const modules = await ensureCategory({ id: "beta5-category-modules", slug: "modules-components", name: "Модули и комплектующие", description: "Составные блоки, шкафы и элементы комплектации дорожных контроллеров ELSYSTAR.", sortOrder: 20 });
  const consoles = await ensureCategory({ id: "beta5-category-consoles", slug: "engineering-consoles", name: "Инженерные пульты", description: "Пульты для настройки, диагностики и ручного управления дорожными контроллерами.", sortOrder: 30 });
  const peripherals = await ensureCategory({ id: "beta5-category-peripherals", slug: "peripheral-equipment", name: "Периферийное оборудование", description: "Периферийные устройства для светофорных объектов и диспетчерского управления.", sortOrder: 40 });
  await ensureCategory({ id: "beta5-category-traffic-lights", slug: "compatible-traffic-lights", name: "Совместимые светофоры", description: "Раздел для подтверждённых моделей светофорного оборудования, совместимых с контроллерами ELSYSTAR.", sortOrder: 50 });

  const uk41 = (await one(`SELECT "id" FROM "Product" WHERE "slug"='uk-4-1m'`))?.id ?? await ensureProduct({
    id: "beta5-product-uk41", slug: "uk-4-1m", model: "УК-4.1М", name: "Дорожный контроллер УК-4.1М",
    shortDescription: "Дорожный контроллер для локального и сетевого управления транспортными и пешеходными потоками на регулируемых перекрёстках.",
    description: "УК-4.1М поддерживает фиксированные, координированные, ручные и адаптивные сценарии управления, диагностику силовых цепей и работу в составе АСУДТ «Мегаполис».",
    categoryId: roadControllers, sortOrder: 10,
  });
  const uk25 = (await one(`SELECT "id" FROM "Product" WHERE "slug"='uk-2-5'`))?.id ?? await ensureProduct({
    id: "beta5-product-uk25", slug: "uk-2-5", model: "УК-2.5", name: "Дорожный контроллер УК-2.5",
    shortDescription: "Контроллер для локального и сетевого управления транспортными потоками и пешеходами на регулируемых перекрёстках.",
    description: "УК-2.5 рассчитан на объекты до 8 направлений и 4 фаз, поддерживает локальные, ручные и координированные режимы и конструктивно совместим с семейством УК-2.",
    categoryId: roadControllers, sortOrder: 20,
  });

  // Verified technical parameters from the currently published ELSYSTAR product page.
  await ensureSpec(uk41, "beta5-uk41-phase-max", "Максимальная длительность фазы", "128", "с", 60);
  await ensureSpec(uk41, "beta5-uk41-phase-step", "Дискретность изменения длительности фазы", "1", "с", 70);
  await ensureSpec(uk41, "beta5-uk41-tvp", "Подключаемые табло вызова пешехода", "4", null, 80);
  await ensureSpec(uk41, "beta5-uk41-priority", "Направления приоритетного пропуска", "16", null, 90);
  await ensureSpec(uk41, "beta5-uk41-supply", "Питание", "220 В, 50 Гц", null, 100);
  await ensureFeature(uk41, "beta5-uk41-modes", "Набор режимов управления", "Фиксированные программы, ручное, координированное, гибкое регулирование с детекторами и аварийные режимы.", 40);
  await ensureFeature(uk41, "beta5-uk41-channel-control", "Контроль силовых цепей", "Проверка каналов на обрыв, пробой и короткое замыкание, а также контроль конфликтных состояний.", 50);

  await ensureSpec(uk25, "beta5-uk25-phase-max", "Максимальная длительность фазы", "63", "с", 40);
  await ensureSpec(uk25, "beta5-uk25-programs", "Фиксированные программы", "до 4", null, 50);
  await ensureSpec(uk25, "beta5-uk25-current", "Максимальный ток канала", "3,5", "А", 60);
  await ensureSpec(uk25, "beta5-uk25-total-current", "Суммарный ток каналов", "до 20", "А", 70);
  await ensureSpec(uk25, "beta5-uk25-size", "Габаритные размеры", "325 × 530 × 545", "мм", 80);
  await ensureSpec(uk25, "beta5-uk25-weight", "Масса", "до 30", "кг", 90);
  await ensureFeature(uk25, "beta5-uk25-green-wave", "Координированное управление", "Поддерживается режим координированного управления «Зелёная волна».", 30);
  await ensureFeature(uk25, "beta5-uk25-compatibility", "Совместимость с УК-2", "Контроллер конструктивно совместим с предшествующим семейством УК-2 и может устанавливаться в те же шкафы.", 40);

  const uk41Configurations = [
    ["beta5-uk41-config-32am", "УК-4.1-32-А-М", "4 блока ключей по 8 каналов, блок процессора, сетевой адаптер с модемом и блок питания.", "УК-4.1-32-А-М"],
    ["beta5-uk41-config-24am", "УК-4.1-24-А-М", "3 блока ключей по 8 каналов, блок процессора, сетевой адаптер с модемом и блок питания.", "УК-4.1-24-А-М"],
    ["beta5-uk41-config-16am", "УК-4.1-16-А-М", "2 блока ключей по 8 каналов, блок процессора, сетевой адаптер с модемом и блок питания.", "УК-4.1-16-А-М"],
    ["beta5-uk41-config-32", "УК-4.1-32", "4 блока ключей по 8 каналов, блок процессора и блок питания.", "УК-4.1-32"],
    ["beta5-uk41-config-24", "УК-4.1-24", "3 блока ключей по 8 каналов, блок процессора и блок питания.", "УК-4.1-24"],
    ["beta5-uk41-config-16", "УК-4.1-16", "Базовый комплект: 2 блока ключей по 8 каналов, блок процессора и блок питания.", "УК-4.1-16"],
  ];
  for (let i = 0; i < uk41Configurations.length; i += 1) {
    const [id, name, description, sku] = uk41Configurations[i];
    await ensureConfiguration(uk41, id, name, description, sku, i * 10);
  }
  await ensureConfiguration(uk25, "beta5-uk25-config-16", "УК-2.5-16", "Полная комплектация: 2 блока ключей по 8 каналов, блок процессора и блок питания.", "УК-2.5-16", 10);

  const productDefinitions = [
    { id:"beta5-product-key-block", slug:"uk41-key-block-8", model:"Блок ключей УК-4.1 / 8 каналов", name:"Блок силовых ключей УК-4.1", shortDescription:"Составная часть УК-4.1: блок силовых ключей на 8 каналов.", description:"Модуль используется в составе контроллера УК-4.1; число блоков зависит от выбранной комплектации контроллера.", categoryId:modules, sortOrder:10, enName:"UK-4.1 power key block", enShort:"Eight-channel power key module used as part of the UK-4.1 controller." },
    { id:"beta5-product-processor", slug:"uk41-processor-block", model:"Блок процессора УК-4.1", name:"Блок процессора УК-4.1", shortDescription:"Процессорный блок — составная часть дорожного контроллера УК-4.1.", description:"Функциональный блок семейства УК-4.1, указанный в официальных вариантах комплектации контроллера.", categoryId:modules, sortOrder:20, enName:"UK-4.1 processor block", enShort:"Processor module used as part of the UK-4.1 traffic controller." },
    { id:"beta5-product-power", slug:"uk41-power-supply", model:"Блок питания УК-4.1", name:"Блок питания УК-4.1", shortDescription:"Блок питания — составная часть дорожного контроллера УК-4.1.", description:"Функциональный блок питания семейства УК-4.1, входящий в опубликованные варианты комплектации контроллера.", categoryId:modules, sortOrder:30, enName:"UK-4.1 power supply", enShort:"Power supply module used as part of the UK-4.1 traffic controller." },
    { id:"beta5-product-network", slug:"uk41-network-adapter-modem", model:"Сетевой адаптер УК-4.1", name:"Сетевой адаптер с модемом УК-4.1", shortDescription:"Сетевой адаптер с модемом для сетевых вариантов комплектации УК-4.1.", description:"Модуль сетевого взаимодействия, указанный в комплектациях УК-4.1-А-М для подключения контроллера к системе управления.", categoryId:modules, sortOrder:40, enName:"UK-4.1 network adapter with modem", enShort:"Network adapter with modem for network-enabled UK-4.1 configurations." },
    { id:"beta5-product-cabinet", slug:"uk41-cabinet", model:"Шкаф УК-4.1", name:"Шкаф контроллера УК-4.1", shortDescription:"Шкаф для размещения оборудования контроллера УК-4.1.", description:"Элемент комплектации семейства УК-4.1, отдельно указанный в официальном перечне изделий.", categoryId:modules, sortOrder:50, enName:"UK-4.1 controller cabinet", enShort:"Cabinet for housing UK-4.1 controller equipment." },
    { id:"beta5-product-pedestal", slug:"uk41-pedestal", model:"Тумба УК-4.1М", name:"Тумба-подставка под УК-4.1М", shortDescription:"Тумба-подставка для установки контроллера УК-4.1М.", description:"Монтажный элемент, отдельно указанный в опубликованном перечне комплектаций и составных изделий УК-4.1М.", categoryId:modules, sortOrder:60, enName:"UK-4.1M pedestal", enShort:"Pedestal for installation of the UK-4.1M traffic controller." },
    { id:"beta5-product-engineering-console", slug:"engineering-console-pu", model:"ПУ", name:"Инженерный пульт ввода-вывода данных", shortDescription:"Инженерный пульт для настройки, диагностики и обслуживания дорожных контроллеров.", description:"Пульт используется для просмотра режимов и состояния контроллера, диагностической информации, электронного журнала, сетевых параметров и настроек.", categoryId:consoles, sortOrder:10, enName:"Engineering data console", enShort:"Engineering console for configuration, diagnostics and maintenance of ELSYSTAR traffic controllers." },
    { id:"beta5-product-tvp", slug:"pedestrian-call-display-tvp", model:"ТВП", name:"Табло вызова пешеходами", shortDescription:"Периферийное устройство вызова пешеходами для светофорного объекта.", description:"ТВП поддерживается контроллерами семейства УК и используется как внешнее устройство светофорного объекта.", categoryId:peripherals, sortOrder:10, enName:"Pedestrian call display", enShort:"Pedestrian call peripheral for signalized intersections." },
    { id:"beta5-product-vpu", slug:"remote-control-vpu-4-1", model:"ВПУ-4.1", name:"Выносной пульт диспетчерского управления ВПУ-4.1", shortDescription:"Выносной пульт для ручного и диспетчерского управления контроллером.", description:"ВПУ указан в официальном перечне периферийного оборудования и поддерживается как внешнее устройство контроллера.", categoryId:consoles, sortOrder:20, enName:"VPU-4.1 remote control console", enShort:"Remote console for manual and dispatch control of a traffic controller." },
  ];

  const createdProducts = new Map();
  for (const item of productDefinitions) {
    const productId = await ensureProduct(item);
    createdProducts.set(item.slug, productId);
    await ensureTranslation("Product", item.slug, "name", item.enName);
    await ensureTranslation("Product", item.slug, "shortDescription", item.enShort);
  }

  const accessorySlugs = ["uk41-key-block-8","uk41-processor-block","uk41-power-supply","uk41-network-adapter-modem","uk41-cabinet","uk41-pedestal"];
  for (let i = 0; i < accessorySlugs.length; i += 1) await ensureRelation(uk41, createdProducts.get(accessorySlugs[i]), `beta5-rel-uk41-${i + 1}`, "ACCESSORY", i * 10);
  await ensureRelation(uk41, createdProducts.get("engineering-console-pu"), "beta5-rel-uk41-console", "COMPATIBLE", 70);
  await ensureRelation(uk41, createdProducts.get("pedestrian-call-display-tvp"), "beta5-rel-uk41-tvp", "COMPATIBLE", 80);
  await ensureRelation(uk41, createdProducts.get("remote-control-vpu-4-1"), "beta5-rel-uk41-vpu", "COMPATIBLE", 90);
  await ensureRelation(uk25, createdProducts.get("engineering-console-pu"), "beta5-rel-uk25-console", "COMPATIBLE", 10);
  await ensureRelation(uk25, createdProducts.get("remote-control-vpu-4-1"), "beta5-rel-uk25-vpu", "COMPATIBLE", 20);

  // Replace only the exact alpha9.2 temporary images. User-supplied media is never overwritten.
  await client.query(`UPDATE "MediaAsset" SET "url"='https://www.elsystar.com/img/uk4_1m.jpg', "title"='Дорожный контроллер УК-4.1М', "alt"='Дорожный контроллер УК-4.1М ELSYSTAR', "updatedAt"=$1 WHERE "id"='bootstrap-uk41-image' AND "url"='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=86'`, [now]);
  await client.query(`UPDATE "MediaAsset" SET "url"='https://www.elsystar.com/img/uk_2.5.jpg', "title"='Дорожный контроллер УК-2.5', "alt"='Дорожный контроллер УК-2.5 ELSYSTAR', "updatedAt"=$1 WHERE "id"='bootstrap-uk25-image' AND "url"='https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=86'`, [now]);
  await client.query(`UPDATE "Solution" SET "imageUrl"='https://www.elsystar.com/img/uk4_1m.jpg', "updatedAt"=$1 WHERE "slug"='intersection-control' AND "imageUrl"='https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1400&q=86'`, [now]);
  await client.query(`UPDATE "Solution" SET "imageUrl"='https://www.elsystar.com/img/megapolis2.jpg', "updatedAt"=$1 WHERE "slug"='megapolis' AND "imageUrl"='https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=86'`, [now]);

  const solutionDefinitions = [
    { id:"beta5-solution-coordinated", slug:"coordinated-control", name:"Координированное управление / «Зелёная волна»", shortDescription:"Согласование сигнальных программ на группе перекрёстков для последовательного пропуска транспортных потоков.", description:"В составе решений ELSYSTAR поддерживается координированное управление перекрёстками, включая централизованные сценарии и режим «Зелёная волна». Система «Мегаполис» позволяет контролировать последовательность сигналов и работать с диаграммой «время-путь».", featured:true, sortOrder:40, imageUrl:"https://www.elsystar.com/img/megapolis2.jpg", enName:"Coordinated traffic control / Green Wave", enShort:"Coordination of signal plans across groups of intersections for progressive traffic flow." },
    { id:"beta5-solution-adaptive", slug:"adaptive-control", name:"Адаптивное управление", shortDescription:"Управление с учётом данных транспортных детекторов и текущего состояния движения.", description:"Контроллеры УК-4.1М и АСУДТ «Мегаполис» поддерживают сценарии гибкого и адаптивного управления с использованием данных транспортных детекторов, анализом измеренных значений и выбором сигнальных программ.", featured:false, sortOrder:50, imageUrl:"https://www.elsystar.com/img/megapolis2.jpg", enName:"Adaptive traffic control", enShort:"Traffic control using detector data and current traffic conditions." },
    { id:"beta5-solution-dispatch", slug:"dispatch-monitoring", name:"Диспетчеризация и мониторинг", shortDescription:"Централизованный контроль состояния объектов, событий, неисправностей и режимов работы.", description:"«Мегаполис» предоставляет диспетчерские рабочие места, отображение состояния сети и перекрёстков, журналы сообщений, диагностику неисправностей и разграничение пользовательских прав.", featured:false, sortOrder:60, imageUrl:"https://www.elsystar.com/img/megapolis2.jpg", enName:"Dispatching and monitoring", enShort:"Centralized supervision of traffic-control sites, events, faults and operating modes." },
  ];
  for (const item of solutionDefinitions) {
    await ensureSolution(item);
    await ensureTranslation("Solution", item.slug, "name", item.enName);
    await ensureTranslation("Solution", item.slug, "shortDescription", item.enShort);
  }

  await ensureSolution({ id:"bootstrap-solution-intersection", slug:"intersection-control", name:"Управление перекрёстками", shortDescription:"Локальное и сетевое управление светофорными объектами с диагностикой и контролем конфликтов.", description:"Контроллеры ELSYSTAR обеспечивают локальное и сетевое управление регулируемыми перекрёстками, работу по фиксированным и координированным программам, ручные режимы, диагностику силовых цепей и контроль конфликтных состояний.", featured:true, sortOrder:10, imageUrl:"https://www.elsystar.com/img/uk4_1m.jpg" });
  await ensureSolution({ id:"bootstrap-solution-megapolis", slug:"megapolis", name:"АСУДТ «Мегаполис»", shortDescription:"Централизованный мониторинг, диспетчеризация и управление городской сетью дорожных объектов.", description:"«Мегаполис» — распределённая программная платформа для централизованного управления дорожным движением. Архитектура разделяет серверные функции и рабочие места, поддерживает масштабирование, мониторинг потоков, координированное и адаптивное управление, уведомления и API для интеграции.", type:"PLATFORM", featured:true, sortOrder:20, imageUrl:"https://www.elsystar.com/img/megapolis2.jpg" });
  await ensureSolution({ id:"bootstrap-solution-modernization", slug:"modernization", name:"Модернизация объектов", shortDescription:"Переход на современное оборудование и программное управление без ненужной замены всей инфраструктуры.", description:"Модульная архитектура контроллеров и программного обеспечения позволяет поэтапно обновлять оборудование, каналы связи и функции управления, сохраняя совместимые элементы существующей инфраструктуры там, где это технически оправдано.", featured:true, sortOrder:30, imageUrl:"https://www.elsystar.com/img/uk4_1m.jpg" });

  const uk41ManualUrl = "https://www.elsystar.com/download/%D0%A3%D0%9A41%D0%9C-%D0%98%D0%BD%D1%81%D1%82%D1%80%D0%BA%D1%86%D0%B8%D1%8F%D0%9F%D0%BE%D0%AD%D0%BA%D1%81%D0%BB%D1%83%D0%B0%D1%82%D0%B0%D1%86%D0%B8%D0%B8%202018.1.pdf";
  await ensureDocumentSeries({ id:"beta5-series-uk41-manual", slug:"uk41-operation-manual", title:"УК-4.1М — инструкция по эксплуатации", description:"Инструкция по установке, подготовке к работе, эксплуатации и техническому обслуживанию дорожного контроллера УК-4.1М.", type:"MANUAL", language:"ru", productId:uk41, sortOrder:10, versionId:"beta5-doc-uk41-manual-2018-1", version:"2018.1", fileUrl:uk41ManualUrl, fileName:"UK41M-operation-manual-2018.1.pdf", mimeType:"application/pdf", releaseDate:new Date("2018-01-01T00:00:00Z") });
  await ensureDocumentSeries({ id:"beta5-series-uk25-manual", slug:"uk25-operation-manual", title:"УК-2.5 — инструкция по эксплуатации", description:"Опубликованная техническая инструкция по эксплуатации контроллера УК-2.5.", type:"MANUAL", language:"ru", productId:uk25, sortOrder:20, versionId:"beta5-doc-uk25-manual", version:"legacy", fileUrl:"https://www.elsystar.com/download/UK25_IP_Instruk.doc", fileName:"UK25_IP_Instruk.doc", mimeType:"application/msword" });
  await ensureDocumentSeries({ id:"beta5-series-uk25-to", slug:"uk25-technical-description", title:"УК-2.5 — техническое описание", description:"Техническое описание контроллера УК-2.5 из открытого центра поддержки ELSYSTAR.", type:"OTHER", language:"ru", productId:uk25, sortOrder:30, versionId:"beta5-doc-uk25-to", version:"legacy", fileUrl:"https://www.elsystar.com/download/TO%20UK2-5.doc", fileName:"TO UK2-5.doc", mimeType:"application/msword" });
  await ensureDocumentSeries({ id:"beta5-series-svp-ru", slug:"svp-user-manual-ru", title:"СВП — инструкция пользователя", description:"Руководство пользователя системы проектирования схемы организации движения светофорного поста.", type:"MANUAL", language:"ru", sortOrder:40, versionId:"beta5-doc-svp-ru-2017", version:"2017", fileUrl:"https://www.elsystar.com/download/SVP_Manual_2017.pdf", fileName:"SVP_Manual_2017.pdf", mimeType:"application/pdf", releaseDate:new Date("2017-01-01T00:00:00Z") });
  await ensureDocumentSeries({ id:"beta5-series-svp-en", slug:"svp-user-manual-en", title:"SVP — Instruction Manual", description:"English-language user manual for the traffic signal plan design software.", type:"MANUAL", language:"en", sortOrder:50, versionId:"beta5-doc-svp-en-2017", version:"2017", fileUrl:"https://www.elsystar.com/download/SVP_Manual_2017_ENGL.pdf", fileName:"SVP_Manual_2017_ENGL.pdf", mimeType:"application/pdf", releaseDate:new Date("2017-01-01T00:00:00Z") });
  await ensureDocumentSeries({ id:"beta5-series-flashprog", slug:"uk41-flashprog", title:"FlashProg — загрузка СОД в УК-4.1М", description:"Программа для загрузки схемы организации движения в УК-4.1М по RS-232.", type:"SOFTWARE", language:"ru", productId:uk41, sortOrder:60, versionId:"beta5-doc-flashprog", version:"legacy", fileUrl:"https://www.elsystar.com/download/flashprog.rar", fileName:"flashprog.rar", mimeType:"application/vnd.rar" });
  await ensureDocumentSeries({ id:"beta5-series-svpwin", slug:"svpwin-software", title:"SVPWin — программа создания СОД", description:"Опубликованная программа для подготовки схем организации движения.", type:"SOFTWARE", language:"ru", sortOrder:70, versionId:"beta5-doc-svpwin", version:"legacy", fileUrl:"https://www.elsystar.com/download/svpwin.rar", fileName:"svpwin.rar", mimeType:"application/vnd.rar" });
  await ensureDocumentSeries({ id:"beta5-series-uk41-brochure", slug:"uk41-uk25-brochure", title:"УК-4.1М / УК-2.5 — буклет", description:"Публичный информационный буклет по дорожным контроллерам УК-4.1М и УК-2.5.", type:"OTHER", language:"ru", productId:uk41, sortOrder:80, versionId:"beta5-doc-uk41-brochure", version:"legacy", fileUrl:"https://www.elsystar.com/download/%D0%A3%D0%9A41%D0%9C-%D0%A3%D0%9A25%D0%91%D1%83%D0%BA%D0%BB%D0%B5%D1%82.pdf", fileName:"UK41M-UK25-brochure.pdf", mimeType:"application/pdf" });
  await ensureDocumentSeries({ id:"beta5-series-uk41-cert", slug:"uk41-certificate", title:"УК-4.1 — сертификат", description:"Сертификат, опубликованный в открытом центре технической поддержки ELSYSTAR.", type:"CERTIFICATE", language:"ru", productId:uk41, sortOrder:90, versionId:"beta5-doc-uk41-cert", version:"legacy", fileUrl:"https://www.elsystar.com/download/%D0%A1%D0%B5%D1%80%D1%82%D0%B8%D1%84%D0%B8%D0%BA%D0%B0%D1%82%20%D0%A3%D0%9A4.1.pdf", fileName:"UK4.1-certificate.pdf", mimeType:"application/pdf" });

  await ensureTranslation("ProductCategory", "modules-components", "name", "Modules and components");
  await ensureTranslation("ProductCategory", "modules-components", "description", "Controller modules, cabinets and configuration components for ELSYSTAR equipment.");
  await ensureTranslation("ProductCategory", "engineering-consoles", "name", "Engineering consoles");
  await ensureTranslation("ProductCategory", "engineering-consoles", "description", "Consoles for controller configuration, diagnostics and manual control.");
  await ensureTranslation("ProductCategory", "peripheral-equipment", "name", "Peripheral equipment");
  await ensureTranslation("ProductCategory", "peripheral-equipment", "description", "Peripheral devices for signalized intersections and dispatch control.");
  await ensureTranslation("ProductCategory", "compatible-traffic-lights", "name", "Compatible traffic signals");

  await client.query(`
    INSERT INTO "AuditLog" ("id","actorEmail","action","entityType","entityId","payload","createdAt")
    VALUES ('beta5-content-bootstrap-v1','system@elsystar.local',$1,'System',$2,$3::jsonb,$4)
    ON CONFLICT ("id") DO NOTHING
  `, [MARKER_ACTION, MARKER_ENTITY, JSON.stringify({
    sourcePages: ["https://www.elsystar.com/production.html", "https://www.elsystar.com/software.html", "https://www.elsystar.com/support.html", "https://www.elsystar.com/price.html"],
    imported: ["catalogCategories","verifiedComponents","controllerConfigurations","controllerSpecs","solutions","officialMedia","publicDocuments","englishLabels"],
    pricing: "not imported",
  }), now]);

  await client.query("COMMIT");
  console.log("[ELSYSTAR] beta5 verified catalog, media and documentation synchronized.");
} catch (error) {
  try { await client.query("ROLLBACK"); } catch {}
  console.error("[ELSYSTAR] beta5 content bootstrap failed:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
