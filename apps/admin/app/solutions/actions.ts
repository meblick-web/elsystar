"use server";

import { ContentStatus, prisma, SolutionType } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../lib/auth";

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9а-яё-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

function status(value: FormDataEntryValue | null) {
  if (value === ContentStatus.PUBLISHED) return ContentStatus.PUBLISHED;
  if (value === ContentStatus.ARCHIVED) return ContentStatus.ARCHIVED;
  return ContentStatus.DRAFT;
}

function type(value: FormDataEntryValue | null) {
  return value === SolutionType.PLATFORM ? SolutionType.PLATFORM : SolutionType.SOLUTION;
}

export async function createSolution(formData: FormData) {
  const session = await requireAdmin();
  if (!prisma) redirect("/solutions?error=db#new");
  const name = String(formData.get("name") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  if (!name || !shortDescription) redirect("/solutions?error=required#new");

  const solution = await prisma.solution.create({ data: {
    name,
    slug: slugify(String(formData.get("slug") ?? name)),
    shortDescription,
    type: type(formData.get("type")),
    status: status(formData.get("status")),
  }});
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "solution.create", entityType: "Solution", entityId: solution.id, payload: { slug: solution.slug } } });
  revalidatePath("/solutions");
  redirect(`/solutions/${solution.id}`);
}

export async function updateSolution(id: string, formData: FormData) {
  const session = await requireAdmin();
  if (!prisma) redirect(`/solutions/${id}?error=db`);
  const name = String(formData.get("name") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  if (!name || !shortDescription) redirect(`/solutions/${id}?error=required`);

  const updated = await prisma.solution.update({ where: { id }, data: {
    name,
    slug: slugify(String(formData.get("slug") ?? name)),
    shortDescription,
    description: String(formData.get("description") ?? "").trim() || null,
    type: type(formData.get("type")),
    status: status(formData.get("status")),
    featured: formData.get("featured") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    seoTitle: String(formData.get("seoTitle") ?? "").trim() || null,
    seoDescription: String(formData.get("seoDescription") ?? "").trim() || null,
  }});
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "solution.update", entityType: "Solution", entityId: id, payload: { slug: updated.slug } } });
  revalidatePath("/solutions");
  revalidatePath(`/solutions/${id}`);
  revalidatePath(`/solutions/${updated.slug}`);
  redirect(`/solutions/${id}?saved=1`);
}
