import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_PREFIX = "pwreset:";

export async function createVerificationToken(email: string) {
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  return token;
}

export async function consumeVerificationToken(token: string) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return { success: false as const, error: "invalid" as const };

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { success: false as const, error: "expired" as const };
  }

  await prisma.verificationToken.delete({ where: { token } });
  return { success: true as const, email: record.identifier };
}

export async function createPasswordResetToken(email: string) {
  const identifier = `${PASSWORD_RESET_PREFIX}${email}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function consumePasswordResetToken(token: string) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || !record.identifier.startsWith(PASSWORD_RESET_PREFIX)) {
    return { success: false as const, error: "invalid" as const };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { success: false as const, error: "expired" as const };
  }

  await prisma.verificationToken.delete({ where: { token } });
  return {
    success: true as const,
    email: record.identifier.slice(PASSWORD_RESET_PREFIX.length),
  };
}
