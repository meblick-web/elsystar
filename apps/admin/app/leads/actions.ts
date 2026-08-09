"use server";

import { AdminRole, LeadStatus, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { requireRole } from "../../lib/auth";

function parseStatus(value: FormDataEntryValue | null) {
  const status = String(value ?? "");
  return Object.values(LeadStatus).includes(status as LeadStatus) ? (status as LeadStatus) : LeadStatus.NEW;
}

export async function updateLeadStatus(leadId: string, formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.SUPPORT);
  if (!prisma) return;

  const status = parseStatus(formData.get("status"));
  await prisma.lead.update({ where: { id: leadId }, data: { status } });
  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "lead.status.update",
      entityType: "Lead",
      entityId: leadId,
      payload: { status },
    },
  });
  revalidatePath("/leads");
  revalidatePath("/");
}
