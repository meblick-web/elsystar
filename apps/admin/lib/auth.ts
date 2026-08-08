import { AdminRole, isDatabaseConfigured, prisma } from "@elsystar/database";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "./password";

const COOKIE_NAME = "elsystar_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export interface AdminSession {
  email: string;
  role: AdminRole;
  userId?: string;
  exp: number;
}

export function isAdminAuthConfigured() {
  return Boolean(process.env.ADMIN_SESSION_SECRET && (process.env.ADMIN_EMAIL || isDatabaseConfigured()));
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "development-only-change-me";
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function createToken(session: AdminSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string): AdminSession | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!session.email || !session.role || !session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminSession | null> {
  const normalized = email.trim().toLowerCase();

  if (isDatabaseConfigured() && prisma) {
    try {
      const user = await prisma.adminUser.findUnique({ where: { email: normalized } });
      if (user?.active && verifyPassword(password, user.passwordHash)) {
        await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await prisma.auditLog.create({ data: { actorEmail: user.email, action: "auth.login", entityType: "AdminUser", entityId: user.id } });
        return { email: user.email, role: user.role, userId: user.id, exp: 0 };
      }
    } catch (error) {
      console.error("admin_db_auth_failed", error);
    }
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD &&
      safeEqual(normalized, process.env.ADMIN_EMAIL.trim().toLowerCase()) &&
      safeEqual(password, process.env.ADMIN_PASSWORD)) {
    return { email: normalized, role: AdminRole.ADMIN, exp: 0 };
  }

  return null;
}

export async function createAdminSession(identity: Omit<AdminSession, "exp"> | AdminSession) {
  const store = await cookies();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  store.set(COOKIE_NAME, createToken({ ...identity, exp }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? verifyToken(token) : null;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(...roles: AdminRole[]) {
  const session = await requireAdmin();
  if (!roles.includes(session.role)) redirect("/?error=forbidden");
  return session;
}
