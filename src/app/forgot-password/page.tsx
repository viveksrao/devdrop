import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
