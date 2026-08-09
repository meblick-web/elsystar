import { NextRequest, NextResponse } from "next/server";
import { canAccessAdminPath } from "./lib/permissions";
import { LEGACY_ADMIN_COOKIE, SECURE_ADMIN_COOKIE, verifyAdminSessionToken } from "./lib/session-token";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/api/health"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const token = request.cookies.get(SECURE_ADMIN_COOKIE)?.value ?? request.cookies.get(LEGACY_ADMIN_COOKIE)?.value;
  let session = null;
  try {
    session = token ? verifyAdminSessionToken(token) : null;
  } catch (error) {
    console.error("admin_proxy_session_verification_failed", error);
  }

  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (!canAccessAdminPath(session.role, pathname)) {
    const denied = new URL("/", request.url);
    denied.searchParams.set("error", "forbidden");
    return NextResponse.redirect(denied);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
