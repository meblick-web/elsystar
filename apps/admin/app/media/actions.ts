"use server";

import { MediaType, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../lib/auth";

function readType(value: FormDataEntryValue | null) {
  const type = String(value ?? "IMAGE");
  return Object.values(MediaType).includes(type as MediaType) ? (type as MediaType) : MediaType.IMAGE;
}

export async function createMediaAsset(formData: FormData) {
  const session = await requireAdmin();
  if (!prisma) return;

  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!title || !url) return;

  const productId = String(formData.get("productId") ?? "").trim() || null;
  const asset = await prisma.mediaAsset.create({
    data: {
      title,
      alt: String(formData.get("alt") ?? "").trim() || null,
      type: readType(formData.get("type")),
      url,
      storageProvider: String(formData.get("storageProvider") ?? "external").trim().slice(0, 50) || "external",
      storageKey: String(formData.get("storageKey") ?? "").trim() || null,
      mimeType: String(formData.get("mimeType") ?? "").trim() || null,
      productId,
      sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
    },
  });

  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "media.create", entityType: "MediaAsset", entityId: asset.id, payload: { title, productId } } });
  revalidatePath("/media");
}

export async function deleteMediaAsset(assetId: string) {
  const session = await requireAdmin();
  if (!prisma) return;
  await prisma.mediaAsset.delete({ where: { id: assetId } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "media.delete", entityType: "MediaAsset", entityId: assetId } });
  revalidatePath("/media");
}
