import { AdminRole, isDatabaseConfigured, prisma } from "@elsystar/database";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "./password";
import {
  adminCookieIsSecure,
  adminCookieName,
  createAdminSessionToken,
  LEGACY_ADMIN_COOKIE,
  SECURE_ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  SignedAdminSession,
  verifyAdminSessionToken,
} from "./session-token";

export type AdminSession = SignedAdminSession;

export function isAdminAuthConfigured() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
  return Boolean(secret.length >= 32 && (process.env.ADMIN_EMAIL || isDatabaseConfigured()));
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function auditFailedLogin(email: string) {
  if (!isDatabaseConfigured() || !prisma) return;
  try {
    await prisma.auditLog.create({
      data: { actorEmail: email || "unknown", action: "auth.login_failed", entityType: "AdminAuth" },
    });
  } catch (error) {
    console.error("admin_failed_login_audit_failed", error);
  }
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminSession | null> {
  const normalized = email.trim().toLowerCase().slice(0, 320);

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

  if (
    process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD &&
    safeEqual(normalized, process.env.ADMIN_EMAIL.trim().toLowerCase()) &&
    safeEqual(password, process.env.ADMIN_PASSWORD)
  ) {
    if (isDatabaseConfigured() && prisma) {
      try {
        await prisma.auditLog.create({ data: { actorEmail: normalized, action: "auth.bootstrap_login", entityType: "AdminAuth" } });
      } catch (error) {
        console.error("bootstrap_login_audit_failed", error);
      }
    }
    return { email: normalized, role: AdminRole.ADMIN, exp: 0 };
  }

  await auditFailedLogin(normalized);
  return null;
}

export async function createAdminSession(identity: Omit<AdminSession, "exp"> | AdminSession) {
  const store = await cookies();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const name = adminCookieName();

  store.set(name, createAdminSessionToken({ ...identity, exp }), {
    httpOnly: true,
    sameSite: "strict",
    secure: adminCookieIsSecure(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    priority: "high",
  });

  if (name !== LEGACY_ADMIN_COOKIE) store.delete(LEGACY_ADMIN_COOKIE);
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(LEGACY_ADMIN_COOKIE);
  store.delete(SECURE_ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(SECURE_ADMIN_COOKIE)?.value ?? store.get(LEGACY_ADMIN_COOKIE)?.value;
  const session = token ? verifyAdminSessionToken(token) : null;
  if (!session) return null;

  // DB-backed sessions are revocable immediately. A disabled account or role change
  // is reflected on the next request instead of waiting for the cookie TTL.
  if (session.userId && isDatabaseConfigured() && prisma) {
    try {
      const user = await prisma.adminUser.findUnique({
        where: { id: session.userId },
        select: { active: true, email: true, role: true },
      });
      if (!user?.active || user.email.toLowerCase() !== session.email.toLowerCase()) return null;
      return { ...session, role: user.role };
    } catch (error) {
      console.error("admin_session_revalidation_failed", error);
      return null;
    }
  }

  return session;
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
