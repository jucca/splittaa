import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE } from "@/lib/i18n/locale-codes";
import {
  localeFromPathname,
  stripLocalePrefix,
} from "@/lib/i18n/strip-locale-prefix";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/toiminta(.*)",
  "/viestit(.*)",
  "/asetukset(.*)",
  "/expenses(.*)",
  "/contacts(.*)",
  "/groups(.*)",
  "/person(.*)",
  "/settlements(.*)",
]);

function redirectLocalePrefixedPath(req: NextRequest): NextResponse | null {
  const locale = localeFromPathname(req.nextUrl.pathname);
  if (!locale) return null;

  const url = req.nextUrl.clone();
  url.pathname = stripLocalePrefix(req.nextUrl.pathname);
  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export default clerkMiddleware(async (auth, req) => {
  const localeRedirect = redirectLocalePrefixedPath(req);
  if (localeRedirect) return localeRedirect;

  const { userId } = await auth();

  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css?|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
