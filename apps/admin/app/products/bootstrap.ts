"use server";

import { AdminRole, prisma, ProductStatus } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "../../lib/auth";

const controllers = [
  {
    model: "УК-4.1М",
    slug: "uk-4-1m",
    name: "Дорожный контроллер УК-4.1М",
    shortDescription: "Универсальный дорожный контроллер для локального и сетевого управления регулируемыми перекрёстками.",
    description: "Контроллер для управления транспортными и пешеходными потоками с локальными и сетевыми режимами работы, диагностикой и интеграцией в централизованные системы управления.",
    specifications: [
      ["Число фаз движения", "16", null],
      ["Число направлений", "16", null],
      ["Фиксированные программы", "16", null],
      ["Силовые каналы", "32", null],
      ["Максимальный ток канала", "5", "А"],
      ["Питание", "220 В, 50 Гц", null],
      ["Интерфейсы", "RS-232, RS-485", null],
    ] as const,
    features: [
      ["Локальная и сетевая работа", "Работа автономно или в составе централизованной системы управления."],
      ["Диагностика и контроль конфликтов", "Контроль состояния оборудования, конфликтных состояний и удалённая диагностика."],
      ["Электронный журнал", "Фиксация событий и состояний контроллера для эксплуатации и диагностики."],
      ["Гибкие каналы связи", "Поддерживаются проводные, радиоканальные и GPRS-сценарии связи."],
    ] as const,
  },
  {
    model: "УК-2.5",
    slug: "uk-2-5",
    name: "Дорожный контроллер УК-2.5",
    shortDescription: "Компактный дорожный контроллер для светофорных объектов меньшей сложности.",
    description: "Контроллер для локального и сетевого управления транспортными и пешеходными потоками на объектах с меньшим количеством фаз и направлений.",
    specifications: [
      ["Число фаз", "до 4", null],
      ["Число направлений", "до 8", null],
      ["Силовые каналы", "16", null],
    ] as const,
    features: [
      ["Компактная конфигурация", "Рациональный вариант для объектов с меньшим числом направлений и фаз."],
      ["Локальная и сетевая работа", "Может использоваться как отдельный контроллер или в составе общей системы управления."],
    ] as const,
  },
];

export async function bootstrapControllerCatalog() {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) redirect("/products?error=db");

  const category = await prisma.productCategory.upsert({
    where: { slug: "road-controllers" },
    create: { slug: "road-controllers", name: "Дорожные контроллеры", description: "Контроллеры ELSYSTAR для управления светофорными объектами.", sortOrder: 10 },
    update: {},
  });

  const created: string[] = [];
  for (let index = 0; index < controllers.length; index += 1) {
    const item = controllers[index];
    const existing = await prisma.product.findUnique({ where: { model: item.model } });
    if (existing) continue;
    const product = await prisma.product.create({
      data: {
        model: item.model,
        slug: item.slug,
        name: item.name,
        shortDescription: item.shortDescription,
        description: item.description,
        categoryId: category.id,
        status: ProductStatus.PUBLISHED,
        featured: true,
        sortOrder: (index + 1) * 10,
        specifications: { create: item.specifications.map(([label, value, unit], order) => ({ label, value, unit, sortOrder: order * 10 })) },
        features: { create: item.features.map(([title, description], order) => ({ title, description, sortOrder: order * 10 })) },
      },
    });
    created.push(product.model);
  }

  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product_catalog.bootstrap", entityType: "Product", payload: { created } } });
  revalidatePath("/products");
  redirect(`/products?bootstrapped=${created.length}`);
}
