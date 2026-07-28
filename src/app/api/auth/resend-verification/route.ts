import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/emails/send-verification-email";
import { isEmailVerificationEnabled } from "@/lib/config";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit("resend-verification", `${ip}:${email}`);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset);
    }

    // Always return success to avoid leaking whether an account exists.
    if (!isEmailVerificationEnabled) {
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password || user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    const token = await createVerificationToken(email);
    await sendVerificationEmail(email, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
