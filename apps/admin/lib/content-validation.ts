import { MediaType } from "@elsystar/database";

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const VIDEO_MIME = new Set(["video/mp4", "video/webm"]);
const FILE_MIME = new Set(["application/pdf", "application/zip", "application/x-zip-compressed", "application/octet-stream", "text/plain", "application/json"]);

export function safeHttpUrl(raw: string, maxLength = 2048) {
  const value = raw.trim().slice(0, maxLength);
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function safeMediaMime(type: MediaType, raw: string) {
  const mime = raw.trim().toLowerCase().slice(0, 120);
  if (!mime) return null;
  if (type === MediaType.IMAGE) return IMAGE_MIME.has(mime) ? mime : null;
  if (type === MediaType.VIDEO) return VIDEO_MIME.has(mime) ? mime : null;
  return FILE_MIME.has(mime) ? mime : null;
}

export function safeDocumentMime(raw: string) {
  const mime = raw.trim().toLowerCase().slice(0, 120);
  return !mime || FILE_MIME.has(mime) ? mime || null : null;
}

export function safeFileName(raw: string) {
  const normalized = raw.trim().split("/").pop()?.split("\\").pop()?.replace(/[\r\n]/g, "_").slice(0, 240) ?? "";
  return normalized || null;
}

export function safeFileSize(value: FormDataEntryValue | null, maxBytes = 250 * 1024 * 1024) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(Math.floor(parsed), maxBytes);
}
