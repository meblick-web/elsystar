"use server";

import { DocumentType, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../lib/auth";

function readType(value: FormDataEntryValue | null) {
  const type = String(value ?? "OTHER");
  return Object.values(DocumentType).includes(type as DocumentType) ? (type as DocumentType) : DocumentType.OTHER;
}

export async function createDocument(formData: FormData) {
  const session = await requireAdmin();
  if (!prisma) return;

  const title = String(formData.get("title") ?? "").trim();
  const fileUrl = String(formData.get("fileUrl") ?? "").trim();
  const fileName = String(formData.get("fileName") ?? "").trim();
  if (!title || !fileUrl || !fileName) return;

  const publish = formData.get("published") === "on";
  const productId = String(formData.get("productId") ?? "").trim() || null;
  const document = await prisma.document.create({
    data: {
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      type: readType(formData.get("type")),
      fileUrl,
      fileName,
      version: String(formData.get("version") ?? "").trim() || null,
      language: String(formData.get("language") ?? "ru").trim().slice(0, 10) || "ru",
      productId,
      isPublic: formData.get("isPublic") === "on",
      publishedAt: publish ? new Date() : null,
    },
  });

  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "document.create", entityType: "Document", entityId: document.id, payload: { title, productId } } });
  revalidatePath("/documents");
}

export async function toggleDocument(documentId: string) {
  const session = await requireAdmin();
  if (!prisma) return;
  const current = await prisma.document.findUnique({ where: { id: documentId }, select: { publishedAt: true } });
  if (!current) return;
  const publishedAt = current.publishedAt ? null : new Date();
  await prisma.document.update({ where: { id: documentId }, data: { publishedAt } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: publishedAt ? "document.publish" : "document.unpublish", entityType: "Document", entityId: documentId } });
  revalidatePath("/documents");
}

export async function deleteDocument(documentId: string) {
  const session = await requireAdmin();
  if (!prisma) return;
  await prisma.document.delete({ where: { id: documentId } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "document.delete", entityType: "Document", entityId: documentId } });
  revalidatePath("/documents");
}
