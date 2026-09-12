import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { DEV_SESSION_COOKIE } from "@/features/auth/dev-session";
import { CUSTOMER_SESSION_COOKIE } from "@/features/auth/customer-session-config";
import { getSupabaseConfig, isDevelopmentAuth, isSupabaseConfigured } from "@/features/auth/auth-config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const mayHavePayloadCustomer = Boolean(request.cookies.get(CUSTOMER_SESSION_COOKIE));
  let authenticated = isDevelopmentAuth && Boolean(request.cookies.get(DEV_SESSION_COOKIE));

  if (isSupabaseConfigured) {
    const { url, key } = getSupabaseConfig();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getClaims();
    authenticated = Boolean(data?.claims?.sub);
  }

  if (request.nextUrl.pathname.startsWith("/account") && !authenticated && !mayHavePayloadCustomer) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return response;
}
