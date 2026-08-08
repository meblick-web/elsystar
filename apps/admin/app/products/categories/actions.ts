"use server";

import { AdminRole, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth";

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9а-яё-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

export async function createCategory(formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) redirect("/products/categories?error=db");
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  if (!name || !slug) redirect("/products/categories?error=required#new");
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  const category = await prisma.productCategory.create({ data: { name, slug, description: String(formData.get("description") ?? "").trim() || null, parentId, sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product_category.create", entityType: "ProductCategory", entityId: category.id, payload: { name, slug, parentId } } });
  revalidatePath("/products/categories");
  revalidatePath("/products");
  redirect("/products/categories?created=1");
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) return;
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const requestedParent = String(formData.get("parentId") ?? "").trim() || null;
  const parentId = requestedParent === categoryId ? null : requestedParent;
  const category = await prisma.productCategory.update({ where: { id: categoryId }, data: { name, slug, description: String(formData.get("description") ?? "").trim() || null, parentId, sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product_category.update", entityType: "ProductCategory", entityId: category.id, payload: { name, slug, parentId } } });
  revalidatePath("/products/categories");
  revalidatePath("/products");
}

export async function deleteCategory(categoryId: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) return;
  const category = await prisma.productCategory.findUnique({ where: { id: categoryId }, include: { _count: { select: { products: true, children: true } } } });
  if (!category || category._count.products || category._count.children) redirect("/products/categories?error=used");
  await prisma.productCategory.delete({ where: { id: categoryId } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product_category.delete", entityType: "ProductCategory", entityId: categoryId, payload: { name: category.name } } });
  revalidatePath("/products/categories");
}
