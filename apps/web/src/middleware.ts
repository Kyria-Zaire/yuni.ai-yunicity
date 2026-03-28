import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwtPayload(
  token: string,
): { role?: string; city?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const json = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { role?: string; city?: string };
    return json;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("yuni-auth")?.value;
  const jwtCookie = request.cookies.get("yuni-jwt")?.value;
  const adminToken = request.cookies.get("yuni-admin-token")?.value;

  if (pathname.startsWith("/admin")) {
    const isGate = pathname === "/admin" || pathname === "/admin/";
    if (!isGate && !adminToken) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session || !jwtCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const raw = decodeURIComponent(jwtCookie);
    const payload = decodeJwtPayload(raw);
    if (payload?.role !== "city_dashboard") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  const needsSession = [
    "/profile",
    "/merchant",
    "/feed",
    "/quests",
  ].some((p) => pathname.startsWith(p));

  if (needsSession && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/profile",
    "/profile/:path*",
    "/merchant",
    "/merchant/:path*",
    "/feed",
    "/feed/:path*",
    "/quests",
    "/quests/:path*",
  ],
};
