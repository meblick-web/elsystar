"use server";

import {
  authenticateAdmin,
  clearAdminSession,
  createAdminSession,
} from "../../lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!authenticateAdmin(email, password)) {
    redirect("/login?error=1");
  }

  await createAdminSession(email.trim().toLowerCase());
  redirect("/");
}

export async function logout() {
  await clearAdminSession();
  redirect("/login");
}
