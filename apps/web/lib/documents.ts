import { isDatabaseConfigured, prisma } from "@elsystar/database";

export type PublicDocument = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  version: string | null;
  language: string;
  product: { model: string; slug: string } | null;
};

export async function getPublicDocuments(): Promise<PublicDocument[]> {
  if (!isDatabaseConfigured() || !prisma) return [];

  try {
    const documents = await prisma.document.findMany({
      where: { isPublic: true, publishedAt: { not: null } },
      orderBy: [{ type: "asc" }, { publishedAt: "desc" }],
      include: { product: { select: { model: true, slug: true } } },
    });

    return documents.map((document) => ({
      id: document.id,
      title: document.title,
      description: document.description,
      type: String(document.type),
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      version: document.version,
      language: document.language,
      product: document.product,
    }));
  } catch (error) {
    console.error("public_documents_query_failed", error);
    return [];
  }
}
