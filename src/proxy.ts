import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuth = Boolean(token);

  const { pathname } = req.nextUrl;
  const localProtectedPaths = [/^\/decks(\/.*)?$/];
  const prodProtectedPaths = [/^\/play(\/.*)?$/, /^\/decks(\/.*)?$/];
  const protectedPaths = process.env.NODE_ENV === "production" ? prodProtectedPaths : localProtectedPaths;
  const isProtected = protectedPaths.some((pattern) => pattern.test(pathname));

  if (isProtected && !isAuth) {
    const signInUrl = new URL("/api/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\..*|_next).*)',
  ],
};
