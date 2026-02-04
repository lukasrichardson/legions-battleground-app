import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
	const isAuth = !!token;

	const { pathname } = req.nextUrl;
	const protectedPaths = [/^\/play(\/.*)?$/, /^\/decks(\/.*)?$/];
	const isProtected = protectedPaths.some((rx) => rx.test(pathname));

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
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\..*|_next).*)',
  ] 
};