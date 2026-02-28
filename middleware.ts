import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes publiques (pas besoin d'auth)
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/auth/callback", "/api/stripe/webhook"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Toujours autoriser les routes publiques
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rediriger vers login si non authentifié
  if (!session && pathname.startsWith("/app")) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Rediriger vers app si déjà connecté et essaie d'aller sur login
  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
