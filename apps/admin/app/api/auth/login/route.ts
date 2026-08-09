import { consumeRateLimit } from "@elsystar/database";
import { authenticateAdmin, createAdminSession } from "../../../../lib/auth";
import { requestSecurityKey } from "../../../../lib/request-security";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) return new Response(null, { status: 413 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(null, { status: 400 });
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 320);
  const password = String(formData.get("password") ?? "").slice(0, 512);
  const keyHash = requestSecurityKey(request, email);
  const rate = await consumeRateLimit({ scope: "admin_login", keyHash, limit: 5, windowSeconds: 15 * 60 });

  if (!rate.allowed) {
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/login?error=rate",
        "Retry-After": String(rate.retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    });
  }

  const identity = await authenticateAdmin(email, password);
  if (!identity) {
    return new Response(null, {
      status: 303,
      headers: { Location: "/login?error=1", "Cache-Control": "no-store" },
    });
  }

  await createAdminSession(identity);
  return new Response(null, {
    status: 303,
    headers: { Location: "/", "Cache-Control": "no-store" },
  });
}
