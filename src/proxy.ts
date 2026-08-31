import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Public editorial and showcase pages need no auth network calls/cookies.
  const path = request.nextUrl.pathname;
  if (["/blog", "/projects", "/brands"].some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf)$).*)"],
};
