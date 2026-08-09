"use server";

import { AdminRole, DocumentType, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "../../lib/auth";
import { safeDocumentMime, safeFileName, safeFileSize, safeHttpUrl } from "../../lib/content-validation";

function readType(value: FormDataEntryValue | null) {
  const type = String(value ?? "OTHER");
  return Object.values(DocumentType).includes(type as DocumentType) ? (type as DocumentType) : DocumentType.OTHER;
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9а-яё-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 140);
}

function readDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readChecksum(value: FormDataEntryValue | null) {
  const checksum = String(value ?? "").trim().toLowerCase();
  if (!checksum) return null;
  return /^[a-f0-9]{64}$/.test(checksum) ? checksum : null;
}

async function documentationSession() {
  return requireRole(AdminRole.ADMIN, AdminRole.EDITOR, AdminRole.SUPPORT);
}

export async function createSeries(formData: FormData) {
  const session = await documentationSession();
  if (!prisma) redirect("/documents?error=db");

  const title = String(formData.get("title") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(requestedSlug || title);
  const language = String(formData.get("language") ?? "ru").trim().toLowerCase().slice(0, 10) || "ru";
  const productId = String(formData.get("productId") ?? "").trim() || null;
  if (!title || !slug) redirect("/documents?error=required#new-series");

  const series = await prisma.documentSeries.create({ data: { title, slug, description: String(formData.get("description") ?? "").trim() || null, type: readType(formData.get("type")), language, productId, sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "document_series.create", entityType: "DocumentSeries", entityId: series.id, payload: { title, slug, productId, type: series.type, language } } });
  revalidatePath("/documents");
  redirect(`/documents/${series.id}?created=1`);
}

export async function updateSeries(seriesId: string, formData: FormData) {
  const session = await documentationSession();
  if (!prisma) return;
  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? title));
  if (!title || !slug) redirect(`/documents/${seriesId}?error=required`);
  const language = String(formData.get("language") ?? "ru").trim().toLowerCase().slice(0, 10) || "ru";
  const productId = String(formData.get("productId") ?? "").trim() || null;
  const type = readType(formData.get("type"));

  await prisma.$transaction(async (tx) => {
    await tx.documentSeries.update({ where: { id: seriesId }, data: { title, slug, description: String(formData.get("description") ?? "").trim() || null, type, language, productId, sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
    await tx.document.updateMany({ where: { seriesId }, data: { title, type, language, productId } });
  });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "document_series.update", entityType: "DocumentSeries", entityId: seriesId, payload: { title, slug, type, language, productId } } });
  revalidatePath("/documents"); revalidatePath(`/documents/${seriesId}`); revalidatePath("/support");
}

export async function deleteSeries(seriesId: string) {
  const session = await documentationSession();
  if (!prisma) return;
  const series = await prisma.documentSeries.findUnique({ where: { id: seriesId }, include: { _count: { select: { versions: true } } } });
  if (!series) return;
  if (series._count.versions > 0) redirect(`/documents/${seriesId}?error=has-versions`);
  await prisma.documentSeries.delete({ where: { id: seriesId } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "document_series.delete", entityType: "DocumentSeries", entityId: seriesId, payload: { title: series.title } } });
  revalidatePath("/documents");
  redirect("/documents?deleted=1");
}

export async function createVersion(seriesId: string, formData: FormData) {
  const session = await documentationSession();
  if (!prisma) redirect(`/documents/${seriesId}?error=db`);
  const series = await prisma.documentSeries.findUnique({ where: { id: seriesId } });
  if (!series) redirect("/documents");

  const version = String(formData.get("version") ?? "").trim().slice(0, 80);
  const fileUrl = safeHttpUrl(String(formData.get("fileUrl") ?? ""));
  const fileName = safeFileName(String(formData.get("fileName") ?? ""));
  const mimeInput = String(formData.get("mimeType") ?? "").trim();
  const mimeType = safeDocumentMime(mimeInput);
  if (!version || !fileUrl || !fileName || (mimeInput && !mimeType)) redirect(`/documents/${seriesId}?error=unsafe-file#new-version`);

  const makeCurrent = formData.get("isCurrent") === "on";
  const publish = formData.get("published") === "on";
  const releaseDate = readDate(formData.get("releaseDate"));
  const checksumInput = String(formData.get("checksumSha256") ?? "").trim();
  const checksumSha256 = readChecksum(formData.get("checksumSha256"));
  if (checksumInput && !checksumSha256) redirect(`/documents/${seriesId}?error=checksum#new-version`);

  const document = await prisma.$transaction(async (tx) => {
    if (makeCurrent) await tx.document.updateMany({ where: { seriesId, isCurrent: true }, data: { isCurrent: false } });
    return tx.document.create({ data: { seriesId, title: series.title, description: String(formData.get("description") ?? "").trim() || null, type: series.type, fileUrl, fileName, version, language: series.language, mimeType, fileSize: safeFileSize(formData.get("fileSize")), checksumSha256, releaseNotes: String(formData.get("releaseNotes") ?? "").trim() || null, releaseDate, isCurrent: makeCurrent, isPublic: formData.get("isPublic") === "on", publishedAt: publish ? new Date() : null, productId: series.productId, sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  });

  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "document_version.create", entityType: "Document", entityId: document.id, payload: { seriesId, version, isCurrent: makeCurrent, published: publish, mimeType } } });
  revalidatePath("/documents"); revalidatePath(`/documents/${seriesId}`); revalidatePath("/support"); revalidatePath(`/support/${series.slug}`);
  redirect(`/documents/${seriesId}?versionCreated=1`);
}

export async function setCurrentVersion(documentId: string, seriesId: string) {
  const session = await documentationSession(); if (!prisma) return;
  await prisma.$transaction([prisma.document.updateMany({ where: { seriesId, isCurrent: true }, data: { isCurrent: false } }), prisma.document.update({ where: { id: documentId }, data: { isCurrent: true } })]);
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "document_version.current", entityType: "Document", entityId: documentId, payload: { seriesId } } });
  revalidatePath(`/documents/${seriesId}`); revalidatePath("/support");
}

export async function toggleDocument(documentId: string) {
  const session = await documentationSession(); if (!prisma) return;
  const current = await prisma.document.findUnique({ where: { id: documentId }, select: { publishedAt: true, seriesId: true, series: { select: { slug: true } } } });
  if (!current) return;
  const publishedAt = current.publishedAt ? null : new Date();
  await prisma.document.update({ where: { id: documentId }, data: { publishedAt } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: publishedAt ? "document.publish" : "document.unpublish", entityType: "Document", entityId: documentId } });
  revalidatePath("/documents"); if (current.seriesId) revalidatePath(`/documents/${current.seriesId}`); revalidatePath("/support"); if (current.series?.slug) revalidatePath(`/support/${current.series.slug}`);
}

export async function deleteDocument(documentId: string) {
  const session = await documentationSession(); if (!prisma) return;
  const document = await prisma.document.findUnique({ where: { id: documentId }, select: { seriesId: true, series: { select: { slug: true } }, version: true } });
  if (!document) return;
  await prisma.document.delete({ where: { id: documentId } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "document.delete", entityType: "Document", entityId: documentId, payload: { seriesId: document.seriesId, version: document.version } } });
  revalidatePath("/documents"); if (document.seriesId) revalidatePath(`/documents/${document.seriesId}`); revalidatePath("/support"); if (document.series?.slug) revalidatePath(`/support/${document.series.slug}`);
}
