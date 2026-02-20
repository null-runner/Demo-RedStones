import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      // user is present only on initial sign-in; cast id as optional to guard
      const uid = (user as { id?: string })["id"];
      if (uid) {
        token["id"] = uid;
        token["email"] = user.email ?? null;
        token["role"] = (user as { role?: string })["role"];
        token["name"] = user.name ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user["id"] = token["id"] as string;
      session.user["role"] = token["role"] as string;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname.startsWith("/sign-in") || nextUrl.pathname.startsWith("/sign-up");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
      const isApiSeed = nextUrl.pathname.startsWith("/api/seed");

      if (isAuthPage || isApiAuth || isApiSeed) return true;
      if (!isLoggedIn) return false;
      return true;
    },
  },
  providers: [
    Credentials({
      authorize() {
        return null; // placeholder — real authorize in index.ts
      },
    }),
  ],
} satisfies NextAuthConfig;
