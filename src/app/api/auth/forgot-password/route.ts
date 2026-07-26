import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/verification-token";
import { sendPasswordResetEmail } from "@/lib/emails/send-password-reset-email";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Always return success to avoid leaking whether an account exists.
    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.password) {
      const token = await createPasswordResetToken(email);
      await sendPasswordResetEmail(email, token);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
