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
  { id: "fallback-controllers", slug: "intersection-control", name: "Управление перекрёстками", shortDescription: "Локальное и сетевое управление светофорными объектами с диагностикой и контролем конфликтов.", description: null, type: "SOLUTION", imageUrl: null },
  { id: "fallback-megapolis", slug: "megapolis", name: "АСУДТ «Мегаполис»", shortDescription: "Централизованный мониторинг, диспетчеризация и управление городской сетью дорожных объектов.", description: null, type: "PLATFORM", imageUrl: null },
  { id: "fallback-modernization", slug: "modernization", name: "Модернизация объектов", shortDescription: "Переход на современное оборудование и программное управление без ненужной замены всей инфраструктуры.", description: null, type: "SOLUTION", imageUrl: null },
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
      return await prisma.project.findMany({
        where: { status: ContentStatus.PUBLISHED, ...(featuredOnly ? { featured: true } : {}) },
        orderBy: [{ sortOrder: "asc" }, { year: "desc" }, { updatedAt: "desc" }],
      }) as PublicProject[];
    } catch (error) {
      console.error("projects_query_failed", error);
    }
  }
  return [];
}

export async function getProjectBySlug(slug: string) {
  if (isDatabaseConfigured() && prisma) {
    try {
      return await prisma.project.findFirst({ where: { slug, status: ContentStatus.PUBLISHED } }) as PublicProject | null;
    } catch (error) {
      console.error("project_query_failed", error);
    }
  }
  return null;
}
