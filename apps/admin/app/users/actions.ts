"use server";

import { AdminRole, prisma } from "@elsystar/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "../../lib/auth";
import { hashPassword } from "../../lib/password";

function readRole(value: FormDataEntryValue | null) {
  return Object.values(AdminRole).includes(value as AdminRole) ? (value as AdminRole) : AdminRole.EDITOR;
}

export async function createUser(formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN);
  if (!prisma) redirect("/users?error=db");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 10) redirect("/users?error=required#new");

  const user = await prisma.adminUser.create({ data: { email, name: name || null, passwordHash: hashPassword(password), role: readRole(formData.get("role")) } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "admin_user.create", entityType: "AdminUser", entityId: user.id, payload: { email: user.email, role: user.role } } });
  revalidatePath("/users");
  redirect("/users?created=1");
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN);
  if (!prisma) return;
  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!user) return;
  const active = formData.get("active") === "on";
  if (user.email === session.email && !active) redirect("/users?error=self");

  const updated = await prisma.adminUser.update({ where: { id: userId }, data: { name: String(formData.get("name") ?? "").trim() || null, role: readRole(formData.get("role")), active } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "admin_user.update", entityType: "AdminUser", entityId: userId, payload: { role: updated.role, active: updated.active } } });
  revalidatePath("/users");
}

export async function resetUserPassword(userId: string, formData: FormData) {
  const session = await requireRole(AdminRole.ADMIN);
  if (!prisma) return;
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) redirect("/users?error=password");
  await prisma.adminUser.update({ where: { id: userId }, data: { passwordHash: hashPassword(password) } });
  await prisma.auditLog.create({ data: { actorEmail: session.email, action: "admin_user.password_reset", entityType: "AdminUser", entityId: userId } });
  revalidatePath("/users");
}
