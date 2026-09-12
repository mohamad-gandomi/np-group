import { NextResponse, type NextRequest } from "next/server";

import { CUSTOMER_SESSION_COOKIE } from "@/features/auth/customer-session-config";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/account") && !request.cookies.has(CUSTOMER_SESSION_COOKIE)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf)$).*)"],
};
