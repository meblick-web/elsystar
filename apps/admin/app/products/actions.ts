"use server";

import { prisma, ProductStatus } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../lib/auth";

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function readStatus(value: FormDataEntryValue | null) {
  if (value === ProductStatus.PUBLISHED) return ProductStatus.PUBLISHED;
  if (value === ProductStatus.ARCHIVED) return ProductStatus.ARCHIVED;
  return ProductStatus.DRAFT;
}

export async function createProduct(formData: FormData) {
  const session = await requireAdmin();
  if (!prisma) redirect("/products?error=db");

  const model = String(formData.get("model") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();

  if (!model || !name || !shortDescription) redirect("/products?error=required#new");

  const product = await prisma.product.create({
    data: {
      model,
      name,
      slug: normalizeSlug(requestedSlug || model),
      shortDescription,
      status: readStatus(formData.get("status")),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "product.create",
      entityType: "Product",
      entityId: product.id,
      payload: { model: product.model, slug: product.slug },
    },
  });

  revalidatePath("/products");
  redirect(`/products/${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  const session = await requireAdmin();
  if (!prisma) redirect(`/products/${productId}?error=db`);

  const model = String(formData.get("model") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? model));

  await prisma.product.update({
    where: { id: productId },
    data: {
      model,
      name,
      slug,
      shortDescription,
      description: description || null,
      status: readStatus(formData.get("status")),
      featured: formData.get("featured") === "on",
      seoTitle: String(formData.get("seoTitle") ?? "").trim() || null,
      seoDescription: String(formData.get("seoDescription") ?? "").trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "product.update",
      entityType: "Product",
      entityId: productId,
      payload: { model, slug },
    },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}

export async function addSpecification(productId: string, formData: FormData) {
  const session = await requireAdmin();
  if (!prisma) redirect(`/products/${productId}?error=db#specifications`);

  const label = String(formData.get("label") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();

  if (!label || !value) redirect(`/products/${productId}?error=spec#specifications`);

  const specification = await prisma.productSpecification.create({
    data: {
      productId,
      label,
      value,
      unit: unit || null,
      sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "product.specification.create",
      entityType: "ProductSpecification",
      entityId: specification.id,
      payload: { productId, label },
    },
  });

  revalidatePath(`/products/${productId}`);
}

export async function deleteSpecification(specificationId: string, productId: string) {
  const session = await requireAdmin();
  if (!prisma) return;

  await prisma.productSpecification.delete({ where: { id: specificationId } });
  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "product.specification.delete",
      entityType: "ProductSpecification",
      entityId: specificationId,
      payload: { productId },
    },
  });

  revalidatePath(`/products/${productId}`);
}

export async function archiveProduct(productId: string) {
  const session = await requireAdmin();
  if (!prisma) return;

  await prisma.product.update({ where: { id: productId }, data: { status: ProductStatus.ARCHIVED } });
  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "product.archive",
      entityType: "Product",
      entityId: productId,
    },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}
