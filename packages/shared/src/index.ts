export type PublicationStatus = "draft" | "published" | "archived";

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: PublicationStatus;
}
