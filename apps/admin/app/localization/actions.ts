"use server";

import { AdminRole, isDatabaseConfigured, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { requireRole } from "../../lib/auth";

function field(formData: FormData, name: string, max = 5000) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

export async function saveTranslation(formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!isDatabaseConfigured() || !prisma) return;
  const locale = field(formData, "locale", 12) || "en";
  const entityType = field(formData, "entityType", 80);
  const entityId = field(formData, "entityId", 200);
  const translationField = field(formData, "field", 120);
  const value = field(formData, "value", 12000);
  if (locale !== "en" || !entityType || !entityId || !translationField || !value) return;

  const existing = await prisma.contentTranslation.findUnique({ where: { locale_entityType_entityId_field: { locale, entityType, entityId, field: translationField } } });
  const row = await prisma.contentTranslation.upsert({
    where: { locale_entityType_entityId_field: { locale, entityType, entityId, field: translationField } },
    create: { locale, entityType, entityId, field: translationField, value },
    update: { value },
  });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: existing ? "translation.update" : "translation.create", entityType: "ContentTranslation", entityId: row.id, payload: { locale, sourceEntityType: entityType, sourceEntityId: entityId, field: translationField } } });
  revalidatePath("/localization");
  revalidatePath("/en", "layout");
}

export async function deleteTranslation(formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!isDatabaseConfigured() || !prisma) return;
  const id = field(formData, "id", 200);
  if (!id) return;
  const existing = await prisma.contentTranslation.findUnique({ where: { id } });
  if (!existing) return;
  await prisma.contentTranslation.delete({ where: { id } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "translation.delete", entityType: "ContentTranslation", entityId: id, payload: { locale: existing.locale, sourceEntityType: existing.entityType, sourceEntityId: existing.entityId, field: existing.field } } });
  revalidatePath("/localization");
  revalidatePath("/en", "layout");
}
