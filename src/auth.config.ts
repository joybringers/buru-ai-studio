import type { NextAuthConfig } from "next-auth";

// Lightweight config — no Node.js modules (nodemailer, Prisma).
// Imported by middleware (Edge Runtime) and merged into the full auth.ts.
export const authConfig = {
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/studio") ||
        nextUrl.pathname.startsWith("/gallery");
      if (isProtected) return isLoggedIn;
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
