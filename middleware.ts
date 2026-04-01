import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isLoginPage = pathname.startsWith("/admin/login");
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-search", req.nextUrl.search);

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  });
  const isLoggedIn = Boolean(token);

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ["/admin/:path*"]
};
