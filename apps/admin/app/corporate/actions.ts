"use server";

import { AdminRole, CorporateMediaSection, MediaType, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "../../lib/auth";

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim() || null;
}

async function editorSession() {
  return requireRole(AdminRole.ADMIN, AdminRole.EDITOR);
}

async function ensureCorporate() {
  if (!prisma) return null;
  return prisma.corporateContent.upsert({ where: { id: "corporate" }, create: { id: "corporate" }, update: {} });
}

function refreshCorporate() {
  revalidatePath("/corporate");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/production");
  revalidatePath("/contacts");
  revalidatePath("/faq");
  revalidatePath("/support");
}

export async function updateCorporate(formData: FormData) {
  const session = await editorSession();
  if (!prisma) redirect("/corporate?error=db");

  const data = {
    companyName: value(formData, "companyName") ?? "ООО «Элсистар»",
    aboutEyebrow: value(formData, "aboutEyebrow") ?? "О КОМПАНИИ",
    aboutTitle: value(formData, "aboutTitle") ?? "Инженерные решения для управления дорожным движением",
    aboutLead: value(formData, "aboutLead") ?? "ООО «Элсистар» — производитель программируемых контроллеров и сервисного оборудования управления дорожным движением.",
    aboutBody: value(formData, "aboutBody"),
    historyTitle: value(formData, "historyTitle") ?? "Опыт разработки и внедрения",
    historyBody: value(formData, "historyBody"),
    productionEyebrow: value(formData, "productionEyebrow") ?? "ПРОИЗВОДСТВО",
    productionTitle: value(formData, "productionTitle") ?? "Собственное производство оборудования",
    productionLead: value(formData, "productionLead") ?? "Компания располагает собственными производственными мощностями для выпуска дорожных контроллеров и оборудования АСУДД.",
    productionBody: value(formData, "productionBody"),
    competenciesTitle: value(formData, "competenciesTitle") ?? "Ключевые компетенции",
    supportTitle: value(formData, "supportTitle") ?? "Техническая поддержка",
    supportBody: value(formData, "supportBody"),
    phonePrimary: value(formData, "phonePrimary"),
    phoneSecondary: value(formData, "phoneSecondary"),
    emailPrimary: value(formData, "emailPrimary"),
    address: value(formData, "address"),
    workingHours: value(formData, "workingHours"),
    legalName: value(formData, "legalName"),
    inn: value(formData, "inn"),
    kpp: value(formData, "kpp"),
    ogrn: value(formData, "ogrn"),
  };

  await prisma.corporateContent.upsert({ where: { id: "corporate" }, create: { id: "corporate", ...data }, update: data });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "corporate.update", entityType: "CorporateContent", entityId: "corporate" } });
  refreshCorporate();
  redirect("/corporate?saved=1");
}

export async function createCompetency(formData: FormData) {
  const session = await editorSession();
  if (!prisma) return;
  await ensureCorporate();
  const title = value(formData, "title");
  if (!title) return;
  const item = await prisma.corporateCompetency.create({ data: { contentId: "corporate", title, description: value(formData, "description"), sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "corporate.competency.create", entityType: "CorporateCompetency", entityId: item.id, payload: { title } } });
  refreshCorporate();
}

export async function updateCompetency(id: string, formData: FormData) {
  const session = await editorSession();
  if (!prisma) return;
  const title = value(formData, "title");
  if (!title) return;
  await prisma.corporateCompetency.update({ where: { id }, data: { title, description: value(formData, "description"), sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "corporate.competency.update", entityType: "CorporateCompetency", entityId: id, payload: { title } } });
  refreshCorporate();
}

export async function deleteCompetency(id: string) {
  const session = await editorSession();
  if (!prisma) return;
  await prisma.corporateCompetency.delete({ where: { id } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "corporate.competency.delete", entityType: "CorporateCompetency", entityId: id } });
  refreshCorporate();
}

export async function createFaq(formData: FormData) {
  const session = await editorSession();
  if (!prisma) return;
  const question = value(formData, "question");
  const answer = value(formData, "answer");
  if (!question || !answer) return;
  const entry = await prisma.faqEntry.create({ data: { question, answer, active: formData.get("active") === "on", sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "faq.create", entityType: "FaqEntry", entityId: entry.id, payload: { question } } });
  refreshCorporate();
}

export async function updateFaq(id: string, formData: FormData) {
  const session = await editorSession();
  if (!prisma) return;
  const question = value(formData, "question");
  const answer = value(formData, "answer");
  if (!question || !answer) return;
  await prisma.faqEntry.update({ where: { id }, data: { question, answer, active: formData.get("active") === "on", sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "faq.update", entityType: "FaqEntry", entityId: id, payload: { question } } });
  refreshCorporate();
}

export async function deleteFaq(id: string) {
  const session = await editorSession();
  if (!prisma) return;
  await prisma.faqEntry.delete({ where: { id } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "faq.delete", entityType: "FaqEntry", entityId: id } });
  refreshCorporate();
}

export async function addCorporateMedia(formData: FormData) {
  const session = await editorSession();
  if (!prisma) return;
  await ensureCorporate();
  const mediaAssetId = value(formData, "mediaAssetId");
  const rawSection = String(formData.get("section") ?? "ABOUT");
  if (!mediaAssetId || !Object.values(CorporateMediaSection).includes(rawSection as CorporateMediaSection)) return;
  const media = await prisma.mediaAsset.findFirst({ where: { id: mediaAssetId, type: MediaType.IMAGE } });
  if (!media) return;
  const section = rawSection as CorporateMediaSection;
  const placement = await prisma.corporateMediaPlacement.upsert({
    where: { contentId_mediaAssetId_section: { contentId: "corporate", mediaAssetId, section } },
    create: { contentId: "corporate", mediaAssetId, section, caption: value(formData, "caption"), sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 },
    update: { caption: value(formData, "caption"), sortOrder: Number(formData.get("sortOrder") ?? 0) || 0 },
  });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "corporate.media.upsert", entityType: "CorporateMediaPlacement", entityId: placement.id, payload: { mediaAssetId, section } } });
  refreshCorporate();
}

export async function deleteCorporateMedia(id: string) {
  const session = await editorSession();
  if (!prisma) return;
  await prisma.corporateMediaPlacement.delete({ where: { id } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "corporate.media.delete", entityType: "CorporateMediaPlacement", entityId: id } });
  refreshCorporate();
}
