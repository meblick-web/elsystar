"use server";

import { AdminRole, MediaType, prisma, ProductRelationType, ProductStatus } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "../../lib/auth";

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9а-яё-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

function readStatus(value: FormDataEntryValue | null) {
  if (value === ProductStatus.PUBLISHED) return ProductStatus.PUBLISHED;
  if (value === ProductStatus.ARCHIVED) return ProductStatus.ARCHIVED;
  return ProductStatus.DRAFT;
}

function formIds(formData: FormData, name: string) {
  return formData.getAll(name).map(String).map((value) => value.trim()).filter(Boolean);
}

export async function createProduct(formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) redirect("/products?error=db");
  const model = String(formData.get("model") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  if (!model || !name || !shortDescription) redirect("/products?error=required#new");
  const product = await prisma.product.create({ data: { model, name, slug: normalizeSlug(requestedSlug || model), shortDescription, status: readStatus(formData.get("status")), categoryId: String(formData.get("categoryId") ?? "").trim() || null } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.create", entityType: "Product", entityId: product.id, payload: { model: product.model, slug: product.slug } } });
  revalidatePath("/products");
  redirect(`/products/${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) redirect(`/products/${productId}?error=db`);
  const model = String(formData.get("model") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? model));
  if (!model || !name || !shortDescription || !slug) redirect(`/products/${productId}?error=required`);

  const solutionIds = formIds(formData, "solutionIds");
  const projectIds = formIds(formData, "projectIds");
  await prisma.product.update({
    where: { id: productId },
    data: {
      model, name, slug, shortDescription,
      description: String(formData.get("description") ?? "").trim() || null,
      status: readStatus(formData.get("status")),
      featured: formData.get("featured") === "on",
      sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
      categoryId: String(formData.get("categoryId") ?? "").trim() || null,
      seoTitle: String(formData.get("seoTitle") ?? "").trim() || null,
      seoDescription: String(formData.get("seoDescription") ?? "").trim() || null,
      solutions: { set: solutionIds.map((id) => ({ id })) },
      projects: { set: projectIds.map((id) => ({ id })) },
    },
  });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.update", entityType: "Product", entityId: productId, payload: { model, slug, categoryId: String(formData.get("categoryId") ?? "") || null, solutionIds, projectIds } } });
  revalidatePath("/products"); revalidatePath(`/products/${productId}`); revalidatePath(`/products/${slug}`);
}

export async function addSpecification(productId: string, formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
  if (!prisma) redirect(`/products/${productId}?error=db#specifications`);
  const label = String(formData.get("label") ?? "").trim(); const value = String(formData.get("value") ?? "").trim(); const unit = String(formData.get("unit") ?? "").trim();
  if (!label || !value) redirect(`/products/${productId}?error=spec#specifications`);
  const specification = await prisma.productSpecification.create({ data: { productId, label, value, unit: unit || null, sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.specification.create", entityType: "ProductSpecification", entityId: specification.id, payload: { productId, label } } });
  revalidatePath(`/products/${productId}`);
}

export async function deleteSpecification(specificationId: string, productId: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR); if (!prisma) return;
  await prisma.productSpecification.delete({ where: { id: specificationId } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.specification.delete", entityType: "ProductSpecification", entityId: specificationId, payload: { productId } } });
  revalidatePath(`/products/${productId}`);
}

export async function addFeature(productId: string, formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR); if (!prisma) return;
  const title = String(formData.get("title") ?? "").trim(); if (!title) return;
  const feature = await prisma.productFeature.create({ data: { productId, title, description: String(formData.get("description") ?? "").trim() || null, sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.feature.create", entityType: "ProductFeature", entityId: feature.id, payload: { productId, title } } }); revalidatePath(`/products/${productId}`);
}

export async function deleteFeature(featureId: string, productId: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR); if (!prisma) return;
  await prisma.productFeature.delete({ where: { id: featureId } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.feature.delete", entityType: "ProductFeature", entityId: featureId, payload: { productId } } }); revalidatePath(`/products/${productId}`);
}

export async function addConfiguration(productId: string, formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR); if (!prisma) return;
  const name = String(formData.get("name") ?? "").trim(); if (!name) return;
  const configuration = await prisma.productConfiguration.create({ data: { productId, name, description: String(formData.get("description") ?? "").trim() || null, sku: String(formData.get("sku") ?? "").trim() || null, sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.configuration.create", entityType: "ProductConfiguration", entityId: configuration.id, payload: { productId, name } } }); revalidatePath(`/products/${productId}`);
}

export async function deleteConfiguration(configurationId: string, productId: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR); if (!prisma) return;
  await prisma.productConfiguration.delete({ where: { id: configurationId } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.configuration.delete", entityType: "ProductConfiguration", entityId: configurationId, payload: { productId } } }); revalidatePath(`/products/${productId}`);
}

export async function addProductMedia(productId: string, formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR); if (!prisma) return;
  const title = String(formData.get("title") ?? "").trim(); const url = String(formData.get("url") ?? "").trim(); if (!title || !url) return;
  const isPrimary = formData.get("isPrimary") === "on";
  if (isPrimary) await prisma.mediaAsset.updateMany({ where: { productId, isPrimary: true }, data: { isPrimary: false } });
  const asset = await prisma.mediaAsset.create({ data: { title, alt: String(formData.get("alt") ?? "").trim() || null, url, type: MediaType.IMAGE, productId, isPrimary, sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.media.create", entityType: "MediaAsset", entityId: asset.id, payload: { productId, isPrimary } } }); revalidatePath(`/products/${productId}`);
}

export async function setPrimaryMedia(assetId: string, productId: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR); if (!prisma) return;
  await prisma.$transaction([prisma.mediaAsset.updateMany({ where: { productId, isPrimary: true }, data: { isPrimary: false } }), prisma.mediaAsset.update({ where: { id: assetId }, data: { isPrimary: true } })]);
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.media.primary", entityType: "MediaAsset", entityId: assetId, payload: { productId } } }); revalidatePath(`/products/${productId}`);
}

export async function deleteProductMedia(assetId: string, productId: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR); if (!prisma) return;
  await prisma.mediaAsset.delete({ where: { id: assetId } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.media.delete", entityType: "MediaAsset", entityId: assetId, payload: { productId } } }); revalidatePath(`/products/${productId}`);
}

export async function addProductRelation(productId: string, formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR); if (!prisma) return;
  const targetProductId = String(formData.get("targetProductId") ?? "").trim(); if (!targetProductId || targetProductId === productId) return;
  const rawType = String(formData.get("type") ?? ProductRelationType.RELATED); const type = Object.values(ProductRelationType).includes(rawType as ProductRelationType) ? rawType as ProductRelationType : ProductRelationType.RELATED;
  const relation = await prisma.productRelation.upsert({ where: { sourceProductId_targetProductId_type: { sourceProductId: productId, targetProductId, type } }, create: { sourceProductId: productId, targetProductId, type }, update: {} });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.relation.create", entityType: "ProductRelation", entityId: relation.id, payload: { productId, targetProductId, type } } }); revalidatePath(`/products/${productId}`);
}

export async function deleteProductRelation(relationId: string, productId: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR); if (!prisma) return;
  await prisma.productRelation.delete({ where: { id: relationId } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.relation.delete", entityType: "ProductRelation", entityId: relationId, payload: { productId } } }); revalidatePath(`/products/${productId}`);
}

export async function archiveProduct(productId: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR); if (!prisma) return;
  await prisma.product.update({ where: { id: productId }, data: { status: ProductStatus.ARCHIVED } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "product.archive", entityType: "Product", entityId: productId } }); revalidatePath("/products"); revalidatePath(`/products/${productId}`);
}
