import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/server/db";
import { env } from "@/server/env";
import { loginSchema } from "@/server/validation/auth";

const emailProvider = Nodemailer({
  // `server` is required by the provider's types even though, in dev
  // without SMTP configured, sendVerificationRequest below never uses it.
  server: {
    host: env.SMTP_HOST || "localhost",
    port: env.SMTP_PORT,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  },
  from: env.EMAIL_FROM,
  async sendVerificationRequest({ identifier, url }) {
    if (!env.SMTP_HOST) {
      // Development fallback: no SMTP configured, log the magic link instead
      // of silently failing so the sign-in flow stays usable locally.
      console.log(`[auth] Magic link for ${identifier}: ${url}`);
      return;
    }

    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
    await transport.sendMail({
      to: identifier,
      from: env.EMAIL_FROM,
      subject: "Sign in to NutriTrail",
      text: `Sign in with this link: ${url}`,
      html: `<p>Sign in with this link:</p><p><a href="${url}">${url}</a></p>`,
    });
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Credentials sign-ins have no Account row, so they can't use database
  // sessions — JWT works for both providers here.
  session: { strategy: "jwt" },
  secret: env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    emailProvider,
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
