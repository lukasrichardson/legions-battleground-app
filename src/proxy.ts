import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isPersonalDeckPath } from "./shared/utils/routeAccess";

export async function proxy(req: NextRequest) {
	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
	const isAuth = !!token;

	const { pathname } = req.nextUrl;
  // Community decks are intentionally public. Personal decks and their editor remain private.
  const localProtectedPaths = [isPersonalDeckPath];
	const prodProtectedPaths = [/^\/play(\/.*)?$/, isPersonalDeckPath];
	const protectedPaths = process.env.NODE_ENV === "production" ? prodProtectedPaths : localProtectedPaths;
	const isProtected = protectedPaths.some((path) => path instanceof RegExp ? path.test(pathname) : path(pathname));

	if (isProtected && !isAuth) {
		const signInUrl = new URL("/api/auth/signin", req.url);
		signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
}

export const config = { 
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack-hmr (webpack hot reload)
     * - favicon.ico
     * - public files
     */
    '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\..*|_next).*)',
  ] 
};
