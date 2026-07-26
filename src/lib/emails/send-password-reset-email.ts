import { resend, EMAIL_FROM } from "@/lib/resend";

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Reset your DevDrop password",
    html: `
      <p>We received a request to reset your DevDrop password.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
    `,
  });
}
