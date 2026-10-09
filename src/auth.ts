import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { ensureUserProfile, getOrCreateDemoUser } from "@/lib/profile";

const demoEnabled = process.env.AUTH_DEMO_LOGIN === "true";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    ...(demoEnabled
      ? [
          Credentials({
            id: "demo",
            name: "Demo",
            credentials: {},
            async authorize() {
              const user = await getOrCreateDemoUser();
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
              };
            },
          }),
        ]
      : []),
  ],
  events: {
    async createUser({ user }) {
      if (user.id) await ensureUserProfile(user.id);
    },
    async signIn({ user }) {
      if (user.id) await ensureUserProfile(user.id);
    },
  },
});
