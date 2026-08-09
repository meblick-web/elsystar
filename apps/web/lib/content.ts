import { ContentStatus, isDatabaseConfigured, prisma } from "@elsystar/database";

export interface PublicSolution {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string | null;
  type: string;
  imageUrl: string | null;
}

export interface PublicProject {
  id: string;
  slug: string;
  title: string;
  summary: string;
  city: string | null;
  region: string | null;
  year: number | null;
  challenge: string | null;
  solutionText: string | null;
  result: string | null;
  coverImageUrl: string | null;
  isDemo?: boolean;
  metrics?: Array<{ value: string; label: string }>;
}

export const fallbackHomepage = {
  heroEyebrow: "ИНТЕЛЛЕКТУАЛЬНЫЕ ТРАНСПОРТНЫЕ СИСТЕМЫ",
  heroTitle: "Контроллеры и системы управления дорожным движением",
  heroDescription: "Разрабатываем оборудование и программные решения для безопасного и эффективного управления городской транспортной инфраструктурой.",
  primaryCtaLabel: "Подобрать решение",
  primaryCtaHref: "/solutions",
  secondaryCtaLabel: "Каталог продукции",
  secondaryCtaHref: "/products",
  solutionsEyebrow: "НАПРАВЛЕНИЯ",
  solutionsTitle: "Всё необходимое для управления движением",
  projectsEyebrow: "ПРОЕКТЫ",
  projectsTitle: "Решения, работающие на реальных объектах",
  supportTitle: "Документы и помощь — в одном месте",
  supportDescription: "Быстрый доступ к руководствам, сертификатам, ПО и актуальным версиям материалов.",
};

const fallbackSolutions: PublicSolution[] = [
  { id: "fallback-controllers", slug: "intersection-control", name: "Управление перекрёстками", shortDescription: "Локальное и сетевое управление светофорными объектами с диагностикой и контролем конфликтов.", description: null, type: "SOLUTION", imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=85" },
  { id: "fallback-megapolis", slug: "megapolis", name: "АСУДТ «Мегаполис»", shortDescription: "Централизованный мониторинг, диспетчеризация и управление городской сетью дорожных объектов.", description: null, type: "PLATFORM", imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=85" },
  { id: "fallback-modernization", slug: "modernization", name: "Модернизация объектов", shortDescription: "Переход на современное оборудование и программное управление без ненужной замены всей инфраструктуры.", description: null, type: "SOLUTION", imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=85" },
];

const demoProjects: PublicProject[] = [
  {
    id: "demo-nalchik",
    slug: "demo-nalchik-smart-traffic",
    title: "Демо-кейс: интеллектуальная транспортная система Нальчика",
    summary: "Демонстрационный сценарий комплексной модернизации городских перекрёстков с адаптивным управлением, мониторингом и диспетчеризацией.",
    city: "Нальчик",
    region: "Кабардино-Балкария",
    year: 2026,
    challenge: "Смоделировать модернизацию загруженных городских перекрёстков без полной замены существующей инфраструктуры, объединить контроллеры и детекторы в единую систему и дать диспетчеру прозрачный мониторинг состояния объектов.",
    solutionText: "В демонстрационном проекте применены дорожные контроллеры ELSYSTAR, детекторы транспорта, централизованный мониторинг и сценарии адаптивного управления. Объекты объединены в единый контур с журналом событий и удалённой диагностикой.",
    result: "Расчётный эффект демонстрационного сценария: снижение средней задержки до 18%, сокращение числа остановок до 14% и более быстрый поиск неисправностей за счёт единого мониторинга.",
    coverImageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1400&q=86",
    isDemo: true,
    metrics: [{ value: "42", label: "перекрёстка" }, { value: "126", label: "контроллеров" }, { value: "−18%", label: "расчётная задержка" }],
  },
  {
    id: "demo-pyatigorsk",
    slug: "demo-pyatigorsk-coordinated-control",
    title: "Демо-кейс: координированное управление Пятигорска",
    summary: "Демонстрационный проект для курортного города: координация магистралей, приоритет общественного транспорта и централизованный контроль.",
    city: "Пятигорск",
    region: "Ставропольский край",
    year: 2026,
    challenge: "Показать работу системы на городе с сезонной нагрузкой, переменной интенсивностью движения и необходимостью поддерживать предсказуемое время проезда по основным коридорам.",
    solutionText: "Сценарий включает координированные планы, сетевое управление контроллерами, сбор данных с детекторов и диспетчерскую панель для контроля режимов и событий.",
    result: "Модельный результат: до 16% сокращения времени прохождения основного коридора и более стабильное распределение транспортного потока в часы пик.",
    coverImageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1400&q=86",
    isDemo: true,
    metrics: [{ value: "28", label: "перекрёстков" }, { value: "84", label: "контроллера" }, { value: "−16%", label: "время в пути" }],
  },
  {
    id: "demo-minvody",
    slug: "demo-minvody-transport-hub",
    title: "Демо-кейс: транспортный узел Минеральных Вод",
    summary: "Демонстрационный сценарий управления светофорными объектами вокруг транспортного узла с мониторингом и удалённой диагностикой.",
    city: "Минеральные Воды",
    region: "Ставропольский край",
    year: 2026,
    challenge: "Смоделировать работу сети на транспортном узле с резкими пиками нагрузки, транзитным потоком и повышенными требованиями к доступности оборудования.",
    solutionText: "В сценарии используются контроллеры, резервируемые каналы связи, транспортные детекторы и централизованный журнал событий с оперативным контролем состояния каждого объекта.",
    result: "Расчётный эффект: до 20% снижения пиковых очередей и сокращение времени диагностики оборудования благодаря единому центру мониторинга.",
    coverImageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1400&q=86",
    isDemo: true,
    metrics: [{ value: "24", label: "объекта" }, { value: "72", label: "контроллера" }, { value: "−20%", label: "пиковые очереди" }],
  },
  {
    id: "demo-krasnodar",
    slug: "demo-krasnodar-urban-its",
    title: "Демо-кейс: городской контур ИТС Краснодара",
    summary: "Расширенный демонстрационный кейс городской ИТС с адаптивным управлением, диспетчеризацией и аналитикой событий.",
    city: "Краснодар",
    region: "Краснодарский край",
    year: 2026,
    challenge: "Показать архитектуру масштабируемой городской системы, которая объединяет десятки объектов и позволяет постепенно добавлять новые контроллеры, детекторы и подсистемы без остановки действующей сети.",
    solutionText: "Проектная модель объединяет локальные контроллеры, телеметрию, централизованный сервер, операторские рабочие места и единый журнал событий. Архитектура рассчитана на поэтапное расширение.",
    result: "Демонстрационные KPI: единая наблюдаемость сети, сокращение ручных операций диспетчера и возможность централизованного изменения планов управления.",
    coverImageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=86",
    isDemo: true,
    metrics: [{ value: "60+", label: "объектов" }, { value: "180", label: "контроллеров" }, { value: "24/7", label: "мониторинг" }],
  },
];

export async function getHomepageContent() {
  if (isDatabaseConfigured() && prisma) {
    try {
      const content = await prisma.homepageContent.findUnique({ where: { id: "homepage" } });
      if (content) return content;
    } catch (error) {
      console.error("homepage_content_query_failed", error);
    }
  }
  return fallbackHomepage;
}

export async function getPublishedSolutions(featuredOnly = false) {
  if (isDatabaseConfigured() && prisma) {
    try {
      const solutions = await prisma.solution.findMany({
        where: { status: ContentStatus.PUBLISHED, ...(featuredOnly ? { featured: true } : {}) },
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      });
      if (solutions.length) return solutions.map((solution) => ({ ...solution, type: String(solution.type) })) as PublicSolution[];
    } catch (error) {
      console.error("solutions_query_failed", error);
    }
  }
  return featuredOnly ? fallbackSolutions.slice(0, 3) : fallbackSolutions;
}

export async function getSolutionBySlug(slug: string) {
  if (isDatabaseConfigured() && prisma) {
    try {
      const solution = await prisma.solution.findFirst({ where: { slug, status: ContentStatus.PUBLISHED } });
      if (solution) return { ...solution, type: String(solution.type) } as PublicSolution;
    } catch (error) {
      console.error("solution_query_failed", error);
    }
  }
  return fallbackSolutions.find((item) => item.slug === slug) ?? null;
}

export async function getPublishedProjects(featuredOnly = false) {
  if (isDatabaseConfigured() && prisma) {
    try {
      const projects = await prisma.project.findMany({
        where: { status: ContentStatus.PUBLISHED, ...(featuredOnly ? { featured: true } : {}) },
        orderBy: [{ sortOrder: "asc" }, { year: "desc" }, { updatedAt: "desc" }],
      }) as PublicProject[];
      if (projects.length) return projects;
    } catch (error) {
      console.error("projects_query_failed", error);
    }
  }
  return featuredOnly ? demoProjects.slice(0, 3) : demoProjects;
}

export async function getProjectBySlug(slug: string) {
  if (isDatabaseConfigured() && prisma) {
    try {
      const project = await prisma.project.findFirst({ where: { slug, status: ContentStatus.PUBLISHED } }) as PublicProject | null;
      if (project) return project;
    } catch (error) {
      console.error("project_query_failed", error);
    }
  }
  return demoProjects.find((item) => item.slug === slug) ?? null;
}
