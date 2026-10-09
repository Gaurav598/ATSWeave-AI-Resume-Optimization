import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth?.user);
  const { pathname } = req.nextUrl;
  const isProtected = [
    "/gallery",
    "/profile",
    "/editor",
    "/dashboard",
    "/match",
    "/generate",
  ].some((path) => pathname.startsWith(path));

  if (isProtected && !isLoggedIn) {
    const url = req.nextUrl.clone();
    const from = `${pathname}${req.nextUrl.search}`;
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("from", from);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/gallery/:path*",
    "/profile/:path*",
    "/editor/:path*",
    "/dashboard/:path*",
    "/match/:path*",
    "/generate/:path*",
  ],
};
