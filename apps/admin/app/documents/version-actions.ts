"use server";

import { AdminRole, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { requireRole } from "../../lib/auth";

export async function deleteSeriesVersion(documentId: string, seriesId: string) {
  const session = await requireRole(AdminRole.ADMIN, AdminRole.EDITOR, AdminRole.SUPPORT);
  if (!prisma) return;

  const existing = await prisma.document.findFirst({
    where: { id: documentId, seriesId },
    select: { id: true, version: true, series: { select: { slug: true } } },
  });
  if (!existing) return;

  await prisma.$transaction(async (tx) => {
    await tx.document.delete({ where: { id: documentId } });
    const currentExists = await tx.document.count({ where: { seriesId, isCurrent: true } });
    if (!currentExists) {
      const replacement = await tx.document.findFirst({
        where: { seriesId },
        orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
        select: { id: true },
      });
      if (replacement) await tx.document.update({ where: { id: replacement.id }, data: { isCurrent: true } });
    }
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "document_version.delete",
      entityType: "Document",
      entityId: documentId,
      payload: { seriesId, version: existing.version },
    },
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${seriesId}`);
  revalidatePath("/support");
  if (existing.series?.slug) revalidatePath(`/support/${existing.series.slug}`);
}
