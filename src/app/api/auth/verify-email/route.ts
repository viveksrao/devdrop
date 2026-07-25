import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/verification-token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const baseUrl = new URL(request.url).origin;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/sign-in?verifyError=invalid`);
  }

  const result = await consumeVerificationToken(token);

  if (!result.success) {
    return NextResponse.redirect(`${baseUrl}/sign-in?verifyError=${result.error}`);
  }

  await prisma.user.update({
    where: { email: result.email },
    data: { emailVerified: new Date() },
  });

  return NextResponse.redirect(`${baseUrl}/sign-in?verified=1`);
}
