import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
        </div>

        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
