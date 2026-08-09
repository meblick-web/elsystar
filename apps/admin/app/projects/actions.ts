"use server";

import { AdminRole, ContentStatus, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "../../lib/auth";

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9а-яё-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}
function status(value: FormDataEntryValue | null) {
  if (value === ContentStatus.PUBLISHED) return ContentStatus.PUBLISHED;
  if (value === ContentStatus.ARCHIVED) return ContentStatus.ARCHIVED;
  return ContentStatus.DRAFT;
}
function optional(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim() || null;
}
async function editorSession() {
  return requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
}

export async function createProject(formData: FormData) {
  const session = await editorSession();
  if (!prisma) redirect("/projects?error=db#new");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!title || !summary) redirect("/projects?error=required#new");
  const yearValue = Number(formData.get("year") ?? 0);
  const project = await prisma.project.create({ data: {
    title,
    summary,
    slug: slugify(String(formData.get("slug") ?? title)),
    city: optional(formData, "city"),
    region: optional(formData, "region"),
    year: yearValue > 1900 ? yearValue : null,
    status: status(formData.get("status")),
    isDemo: formData.get("isDemo") === "on",
  } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "project.create", entityType: "Project", entityId: project.id, payload: { slug: project.slug, isDemo: project.isDemo } } });
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const session = await editorSession();
  if (!prisma) redirect(`/projects/${id}?error=db`);
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!title || !summary) redirect(`/projects/${id}?error=required`);
  const productIds = formData.getAll("productIds").map(String).filter(Boolean);
  const solutionIds = formData.getAll("solutionIds").map(String).filter(Boolean);
  const yearValue = Number(formData.get("year") ?? 0);

  const project = await prisma.project.update({ where: { id }, data: {
    title,
    slug: slugify(String(formData.get("slug") ?? title)),
    summary,
    city: optional(formData, "city"),
    region: optional(formData, "region"),
    year: yearValue > 1900 ? yearValue : null,
    challenge: optional(formData, "challenge"),
    solutionText: optional(formData, "solutionText"),
    result: optional(formData, "result"),
    coverImageUrl: optional(formData, "coverImageUrl"),
    isDemo: formData.get("isDemo") === "on",
    metric1Value: optional(formData, "metric1Value"),
    metric1Label: optional(formData, "metric1Label"),
    metric2Value: optional(formData, "metric2Value"),
    metric2Label: optional(formData, "metric2Label"),
    metric3Value: optional(formData, "metric3Value"),
    metric3Label: optional(formData, "metric3Label"),
    status: status(formData.get("status")),
    featured: formData.get("featured") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
    seoTitle: optional(formData, "seoTitle"),
    seoDescription: optional(formData, "seoDescription"),
    products: { set: productIds.map((productId) => ({ id: productId })) },
    solutions: { set: solutionIds.map((solutionId) => ({ id: solutionId })) },
  }});
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "project.update", entityType: "Project", entityId: id, payload: { slug: project.slug, products: productIds.length, solutions: solutionIds.length, isDemo: project.isDemo } } });
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath(`/projects/${project.slug}`);
  revalidatePath("/");
  redirect(`/projects/${id}?saved=1`);
}
