import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import Google from "next-auth/providers/google";
import { createTransport } from "nodemailer";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { creditUser } from "@/lib/ledger";

const WELCOME_CREDITS = 50;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await creditUser(user.id, WELCOME_CREDITS, "welcome_bonus");
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Nodemailer({
      server: process.env.EMAIL_SERVER ?? "",
      from: process.env.EMAIL_FROM ?? "BuruStudio <noreply@burustudio.com>",
      async sendVerificationRequest({ identifier, url, provider }) {
        // In development: print the link to the terminal so there's no need for a real email server.
        if (process.env.NODE_ENV !== "production") {
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nMagic link for ${identifier}\n    ${url}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
          return;
        }
        // Production: send via SMTP (configure EMAIL_SERVER).
        const transport = createTransport(provider.server as string);
        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Sign in to BuruStudio",
          text: `Click to sign in: ${url}\n\nIf you didn't request this, ignore it.`,
          html: `
            <div style="font-family:sans-serif;max-width:420px;margin:40px auto;padding:32px;background:#09090b;border-radius:12px;border:1px solid #27272a;color:#fafafa">
              <h1 style="font-size:20px;font-weight:600;margin:0 0 8px">Sign in to BuruStudio</h1>
              <p style="color:#a1a1aa;margin:0 0 24px;font-size:14px">Click the button below — the link expires in 24 hours.</p>
              <a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:500">Sign in</a>
              <p style="color:#52525b;font-size:12px;margin:24px 0 0">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      },
    }),
  ],
});
