"use server";

import { AdminRole, MediaType, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { requireRole } from "../../lib/auth";
import { safeFileSize, safeHttpUrl, safeMediaMime } from "../../lib/content-validation";

function readType(value: FormDataEntryValue | null) {
  const type = String(value ?? "IMAGE");
  return Object.values(MediaType).includes(type as MediaType) ? (type as MediaType) : MediaType.IMAGE;
}

export async function createMediaAsset(formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) return;

  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const url = safeHttpUrl(String(formData.get("url") ?? ""));
  const type = readType(formData.get("type"));
  const mimeInput = String(formData.get("mimeType") ?? "").trim();
  const mimeType = safeMediaMime(type, mimeInput);
  if (!title || !url || (mimeInput && !mimeType)) return;

  const productId = String(formData.get("productId") ?? "").trim() || null;
  const asset = await prisma.mediaAsset.create({
    data: {
      title,
      alt: String(formData.get("alt") ?? "").trim().slice(0, 300) || null,
      type,
      url,
      storageProvider: String(formData.get("storageProvider") ?? "external").trim().slice(0, 50) || "external",
      storageKey: String(formData.get("storageKey") ?? "").trim().slice(0, 500) || null,
      mimeType,
      fileSize: safeFileSize(formData.get("fileSize")),
      productId,
      sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
    },
  });

  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "media.create", entityType: "MediaAsset", entityId: asset.id, payload: { title, productId, type, mimeType } } });
  revalidatePath("/media");
}

export async function deleteMediaAsset(assetId: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) return;
  await prisma.mediaAsset.delete({ where: { id: assetId } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "media.delete", entityType: "MediaAsset", entityId: assetId } });
  revalidatePath("/media");
}
