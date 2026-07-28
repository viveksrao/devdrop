import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/emails/send-verification-email";
import { isEmailVerificationEnabled } from "@/lib/config";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit("register", ip);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset);
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: isEmailVerificationEnabled ? null : new Date(),
      },
    });

    if (isEmailVerificationEnabled) {
      try {
        const token = await createVerificationToken(email);
        await sendVerificationEmail(email, token);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
