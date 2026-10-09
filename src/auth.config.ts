import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const authConfig = {
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: googleConfigured
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
          authorization: { params: { prompt: "select_account" } },
        }),
      ]
    : [],
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isProtected = [
        "/gallery",
        "/profile",
        "/editor",
        "/dashboard",
        "/match",
        "/generate",
      ].some((path) => request.nextUrl.pathname.startsWith(path));
      if (isProtected && !isLoggedIn) {
        const url = new URL("/", request.nextUrl.origin);
        const from = `${request.nextUrl.pathname}${request.nextUrl.search}`;
        url.searchParams.set("from", from);
        return Response.redirect(url);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.image = (token.picture as string) ?? session.user.image;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
