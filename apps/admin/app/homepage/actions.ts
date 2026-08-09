"use server";

import { prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../lib/auth";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function updateHomepage(formData: FormData) {
  const session = await requireAdmin();
  if (!prisma) redirect("/homepage?error=db");

  const heroTitle = text(formData, "heroTitle");
  const heroDescription = text(formData, "heroDescription");
  if (!heroTitle || !heroDescription) redirect("/homepage?error=required");

  const data = {
    heroEyebrow: text(formData, "heroEyebrow"),
    heroTitle,
    heroDescription,
    primaryCtaLabel: text(formData, "primaryCtaLabel"),
    primaryCtaHref: text(formData, "primaryCtaHref"),
    secondaryCtaLabel: text(formData, "secondaryCtaLabel"),
    secondaryCtaHref: text(formData, "secondaryCtaHref"),
    trust1Value: text(formData, "trust1Value"),
    trust1Label: text(formData, "trust1Label"),
    trust2Value: text(formData, "trust2Value"),
    trust2Label: text(formData, "trust2Label"),
    trust3Value: text(formData, "trust3Value"),
    trust3Label: text(formData, "trust3Label"),
    productsEyebrow: text(formData, "productsEyebrow"),
    productsTitle: text(formData, "productsTitle"),
    solutionsEyebrow: text(formData, "solutionsEyebrow"),
    solutionsTitle: text(formData, "solutionsTitle"),
    projectsEyebrow: text(formData, "projectsEyebrow"),
    projectsTitle: text(formData, "projectsTitle"),
    supportEyebrow: text(formData, "supportEyebrow"),
    supportTitle: text(formData, "supportTitle"),
    supportDescription: text(formData, "supportDescription"),
    requestEyebrow: text(formData, "requestEyebrow"),
    requestTitle: text(formData, "requestTitle"),
    requestDescription: text(formData, "requestDescription"),
  };

  await prisma.homepageContent.upsert({
    where: { id: "homepage" },
    create: { id: "homepage", ...data },
    update: data,
  });

  await prisma.auditLog.create({
    data: { actorEmail: session.email, action: "homepage.update", entityType: "HomepageContent", entityId: "homepage" },
  });

  revalidatePath("/");
  revalidatePath("/homepage");
  redirect("/homepage?saved=1");
}
