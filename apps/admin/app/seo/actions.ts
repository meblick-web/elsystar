"use server";

import { AdminRole, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "../../lib/auth";

function normalizePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "/";
  const withoutOrigin = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withoutOrigin.replace(/\/+/g, "/").split("#", 1)[0] || "/";
}

function canonicalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function redirectTarget(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed.replace(/\/+/g, "/");
}

export async function saveSeoRoute(formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) redirect("/seo?error=db");
  const path = normalizePath(String(formData.get("path") ?? ""));
  const canonicalInput = String(formData.get("canonical") ?? "").trim();
  const canonical = canonicalUrl(canonicalInput);
  if (canonicalInput && !canonical) redirect("/seo?error=canonical");

  const data = {
    title: String(formData.get("title") ?? "").trim().slice(0, 160) || null,
    description: String(formData.get("description") ?? "").trim().slice(0, 320) || null,
    canonical,
    indexable: formData.get("indexable") === "on",
    follow: formData.get("follow") === "on",
  };
  const route = await prisma.seoRoute.upsert({ where: { path }, create: { path, ...data }, update: data });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "seo_route.upsert", entityType: "SeoRoute", entityId: route.id, payload: { path, indexable: data.indexable } } });
  revalidatePath("/seo");
  revalidatePath(path);
  redirect("/seo?saved=1");
}

export async function deleteSeoRoute(id: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) return;
  const route = await prisma.seoRoute.delete({ where: { id } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "seo_route.delete", entityType: "SeoRoute", entityId: id, payload: { path: route.path } } });
  revalidatePath("/seo");
  revalidatePath(route.path);
}

export async function createRedirect(formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) redirect("/seo?error=db#redirects");
  const fromPath = normalizePath(String(formData.get("fromPath") ?? ""));
  const toPath = redirectTarget(String(formData.get("toPath") ?? ""));
  const status = Number(formData.get("status")) === 302 ? 302 : 301;
  if (!fromPath || !toPath || fromPath === toPath) redirect("/seo?error=redirect#redirects");
  const rule = await prisma.redirectRule.upsert({ where: { fromPath }, create: { fromPath, toPath, status, enabled: true }, update: { toPath, status, enabled: true } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "redirect.upsert", entityType: "RedirectRule", entityId: rule.id, payload: { fromPath, toPath, status } } });
  revalidatePath("/seo");
  redirect("/seo?redirectSaved=1#redirects");
}

export async function toggleRedirect(id: string, enabled: boolean) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) return;
  const rule = await prisma.redirectRule.update({ where: { id }, data: { enabled } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "redirect.toggle", entityType: "RedirectRule", entityId: id, payload: { enabled, fromPath: rule.fromPath } } });
  revalidatePath("/seo");
}

export async function deleteRedirect(id: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) return;
  const rule = await prisma.redirectRule.delete({ where: { id } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "redirect.delete", entityType: "RedirectRule", entityId: id, payload: { fromPath: rule.fromPath } } });
  revalidatePath("/seo");
}
