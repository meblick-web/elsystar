"use server";

import { authenticateAdmin, clearAdminSession, createAdminSession } from "../../lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const identity = await authenticateAdmin(email, password);

  if (!identity) redirect("/login?error=1");

  await createAdminSession(identity);
  redirect("/");
}

export async function logout() {
  await clearAdminSession();
  redirect("/login");
}
