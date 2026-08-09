import { createHmac, timingSafeEqual } from "node:crypto";

export const LEGACY_ADMIN_COOKIE = "elsystar_admin_session";
export const SECURE_ADMIN_COOKIE = "__Host-elsystar_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;
export const SESSION_ADMIN_ROLES = ["ADMIN", "EDITOR", "SUPPORT", "ANALYST"] as const;
export type SessionAdminRole = (typeof SESSION_ADMIN_ROLES)[number];

export interface SignedAdminSession {
  email: string;
  role: SessionAdminRole;
  userId?: string;
  exp: number;
}

export function adminCookieIsSecure() {
  const publicUrl = process.env.NEXT_PUBLIC_ADMIN_URL?.trim() ?? "";
  return process.env.NODE_ENV === "production" || publicUrl.startsWith("https://") || Boolean(process.env.CODESPACE_NAME);
}

export function adminCookieName() {
  return adminCookieIsSecure() ? SECURE_ADMIN_COOKIE : LEGACY_ADMIN_COOKIE;
}

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters in production");
  return secret || "development-only-session-secret-change-me";
}

function signature(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createAdminSessionToken(session: SignedAdminSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyAdminSessionToken(token: string): SignedAdminSession | null {
  const [payload, providedSignature] = token.split(".");
  if (!payload || !providedSignature || !safeEqual(signature(payload), providedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SignedAdminSession;
    const now = Math.floor(Date.now() / 1000);
    if (!session.email || !session.role || !session.exp || session.exp <= now) return null;
    if (!SESSION_ADMIN_ROLES.includes(session.role)) return null;
    return session;
  } catch {
    return null;
  }
}
