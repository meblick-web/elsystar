import { authenticateAdmin, createAdminSession } from "../../../../lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const identity = await authenticateAdmin(email, password);
  if (!identity) {
    return new Response(null, {
      status: 303,
      headers: { Location: "/login?error=1" },
    });
  }

  await createAdminSession(identity);
  return new Response(null, {
    status: 303,
    headers: { Location: "/" },
  });
}
