import NextAuth, { CredentialsSignin } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";
import { isEmailVerificationEnabled } from "@/lib/config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email-not-verified";
}

class RateLimitedError extends CredentialsSignin {
  code = "rate-limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    authorized: ({ auth, request }) => {
      const isProtected = request.nextUrl.pathname.startsWith("/dashboard");
      if (!isProtected) return true;
      return !!auth;
    },
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id;

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isPro: true },
        });
        token.isPro = dbUser?.isPro ?? false;
      }

      return token;
    },
    session: ({ session, token }) => {
      if (token.id) session.user.id = token.id as string;
      session.user.isPro = Boolean(token.isPro);
      return session;
    },
  },
  ...authConfig,
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const ip = getClientIp(request);
        const rateLimit = await checkRateLimit(
          "login",
          `${ip}:${parsed.data.email}`
        );
        if (!rateLimit.success) {
          throw new RateLimitedError();
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.password
        );
        if (!isValid) return null;

        if (isEmailVerificationEnabled && !user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return user;
      },
    }),
  ],
});
