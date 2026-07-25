import { resend, EMAIL_FROM } from "@/lib/resend";

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Verify your DevDrop email address",
    html: `
      <p>Welcome to DevDrop!</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify email address</a></p>
      <p>This link expires in 24 hours. If you didn't create a DevDrop account, you can ignore this email.</p>
    `,
  });
}
