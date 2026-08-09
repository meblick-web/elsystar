import { CorporateMediaSection, isDatabaseConfigured, prisma } from "@elsystar/database";

export interface PublicCorporateMedia {
  id: string;
  section: string;
  caption: string | null;
  url: string;
  title: string;
  alt: string | null;
}

export interface PublicCompetency {
  id: string;
  title: string;
  description: string | null;
}

export interface PublicFaqEntry {
  id: string;
  question: string;
  answer: string;
}

export const fallbackCorporate = {
  id: "corporate",
  companyName: "ООО «Элсистар»",
  aboutEyebrow: "О КОМПАНИИ",
  aboutTitle: "Инженерные решения для управления дорожным движением",
  aboutLead: "ООО «Элсистар» — производитель программируемых контроллеров и сервисного оборудования управления дорожным движением.",
  aboutBody: "Компания основана группой разработчиков контроллеров дорожного движения ОАО «Телеавтоматика». Основная продукция — контроллеры и системы автоматизированного управления дорожным движением. Дорожные контроллеры УК-4.1М и УК-2.5 развивают накопленный многолетний опыт разработки и изготовления оборудования.",
  historyTitle: "Опыт разработки и внедрения",
  historyBody: "АСУДТ «Мегаполис» разрабатывалась и испытывалась компанией в Ростове-на-Дону. На официальном сайте ELSYSTAR указано, что в 2005 году система охватывала 57 перекрёстков, а в 2009 году — 196.",
  productionEyebrow: "ПРОИЗВОДСТВО",
  productionTitle: "Собственное производство оборудования",
  productionLead: "Компания располагает собственными производственными мощностями для выпуска дорожных контроллеров и оборудования АСУДД.",
  productionBody: "Производственное направление включает дорожные контроллеры, модули сопряжения для различных типов контроллеров и модули сбора информации о дорожном движении. ELSYSTAR поставляет как отдельные компоненты и подсистемы АСУДД, так и комплексные решения.",
  competenciesTitle: "Ключевые компетенции",
  supportTitle: "Техническая поддержка оборудования и ПО",
  supportBody: "В центре документации доступны руководства, сертификаты, программы для подготовки и загрузки СОД, а также материалы по АСУДТ «Мегаполис».",
  phonePrimary: "+7 (967) 423-20-54",
  phoneSecondary: "8 (86635) 41034",
  emailPrimary: "arkhast@mail.ru",
  address: null as string | null,
  workingHours: null as string | null,
  legalName: "ООО «Элсистар»",
  inn: null as string | null,
  kpp: null as string | null,
  ogrn: null as string | null,
  competencies: [
    { id: "fallback-controllers", title: "Дорожные контроллеры", description: "Разработка и производство программируемых контроллеров для транспортных и пешеходных потоков." },
    { id: "fallback-asudd", title: "АСУДТ «Мегаполис»", description: "Централизованное управление, мониторинг, координация и диспетчеризация дорожной сети." },
    { id: "fallback-modules", title: "Модули и периферия АСУДД", description: "Модули сопряжения и сбора информации о дорожном движении для интеграции объектов." },
    { id: "fallback-integration", title: "Программное обеспечение и интеграция", description: "Модульная программная архитектура и интерфейсы для связи с внешними системами." },
  ] as PublicCompetency[],
  media: [] as PublicCorporateMedia[],
};

const fallbackFaq: PublicFaqEntry[] = [
  { id: "faq-docs", question: "Где скачать руководства и сертификаты?", answer: "Актуальные руководства, сертификаты и другие технические материалы собраны в разделе «Документация». Для серий документов доступна история версий." },
  { id: "faq-software", question: "Где получить программное обеспечение и прошивки?", answer: "Опубликованные программы, прошивки и сопроводительные материалы доступны в центре документации. Если нужной версии нет в открытом доступе, свяжитесь с технической поддержкой." },
  { id: "faq-offer", question: "Как запросить коммерческое предложение?", answer: "Используйте форму «Получить КП» на сайте и опишите объект, требуемое оборудование или задачу. Заявка попадёт в коммерческий контур ELSYSTAR." },
];

export async function getCorporateContent() {
  if (isDatabaseConfigured() && prisma) {
    try {
      const content = await prisma.corporateContent.findUnique({
        where: { id: "corporate" },
        include: {
          competencies: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
          mediaPlacements: {
            orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
            include: { mediaAsset: true },
          },
        },
      });
      if (content) {
        return {
          ...fallbackCorporate,
          ...content,
          aboutBody: content.aboutBody ?? fallbackCorporate.aboutBody,
          historyBody: content.historyBody ?? fallbackCorporate.historyBody,
          productionBody: content.productionBody ?? fallbackCorporate.productionBody,
          supportBody: content.supportBody ?? fallbackCorporate.supportBody,
          competencies: content.competencies.length ? content.competencies.map((item) => ({ id: item.id, title: item.title, description: item.description })) : fallbackCorporate.competencies,
          media: content.mediaPlacements.map((item) => ({ id: item.id, section: String(item.section), caption: item.caption, url: item.mediaAsset.url, title: item.mediaAsset.title, alt: item.mediaAsset.alt })),
        };
      }
    } catch (error) {
      console.error("corporate_content_query_failed", error);
    }
  }
  return fallbackCorporate;
}

export async function getCorporateMedia(section: CorporateMediaSection | keyof typeof CorporateMediaSection) {
  const content = await getCorporateContent();
  return content.media.filter((item) => item.section === String(section));
}

export async function getFaqEntries(): Promise<PublicFaqEntry[]> {
  if (isDatabaseConfigured() && prisma) {
    try {
      const entries = await prisma.faqEntry.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
      if (entries.length) return entries.map((entry) => ({ id: entry.id, question: entry.question, answer: entry.answer }));
    } catch (error) {
      console.error("faq_query_failed", error);
    }
  }
  return fallbackFaq;
}
