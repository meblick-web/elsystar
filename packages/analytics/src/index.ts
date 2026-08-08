export type AnalyticsEventName =
  | "page_view"
  | "product_view"
  | "document_download"
  | "cta_click"
  | "lead_submit"
  | "phone_click"
  | "email_click";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  path: string;
  productId?: string;
  documentId?: string;
  occurredAt: string;
}
